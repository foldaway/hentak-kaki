const fetch = require('node-fetch');
const dateFormat = require('dateformat');
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL || null);
const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);
const lrange = promisify(redisClient.lrange).bind(redisClient);
const lpush = promisify(redisClient.lpush).bind(redisClient);
const hget = promisify(redisClient.hget).bind(redisClient);
const hset = promisify(redisClient.hset).bind(redisClient);

const KEY_LATEST_UPDATE_TIMESTAMP = 'WEATHER_LATEST_UPDATE_TIMESTAMP';
const KEY_LAST_FETCH_UPDATE_PERIODENDS = 'WEATHER_LAST_FETCH_UPDATE_PERIODENDS';
const KEY_SECTOR_LIST = 'WEATHER_SECTOR_LIST';

const CHANGETYPE = {
  WASCATONE: 'WASCATONE',
  NOWCATONE: 'NOWCATONE',
  EXTENDED: 'EXTENDED'
};

/* eslint-disable camelcase, no-await-in-loop */

module.exports = {
  cron: '*/1   *   *   *   *',
  func: async (bot) => {
    const today = new Date();
    const url = `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`;
    console.log(`Fetching '${url}'`);
    const { area_metadata, items } = await fetch(url)
      .then(r => r.json());

    const areas = area_metadata.map((area) => area.name);
    await del(KEY_SECTOR_LIST);
    await lpush(KEY_SECTOR_LIST, ...areas.reverse());

    if (items.length <= 2) {
      console.log('Not enough items to compare');
      return;
    }

    const latestItem = items[items.length - 1];
    const previousItem = items[items.length - 2];

    if (latestItem.update_timestamp === await get(KEY_LATEST_UPDATE_TIMESTAMP)) {
      return;
    }
    set(KEY_LATEST_UPDATE_TIMESTAMP, latestItem.update_timestamp);

    const areaForecastMap = {};
    const chatIdsSet = new Set();

    console.log(`Processing ${areas.length} areas`);

    for (const area of areas) {
      const latestForecast = latestItem.forecasts
        .find((forecast) => forecast.area === area).forecast;
      const previousForecast = previousItem.forecasts
        .find((forecast) => forecast.area === area).forecast;

      const redisLastFetchedPeriodEnd = await hget(KEY_LAST_FETCH_UPDATE_PERIODENDS, area);
      const validPeriodEnd = dateFormat(latestItem.valid_period.end, 'HHMM');

      await hset(KEY_LAST_FETCH_UPDATE_PERIODENDS, area, validPeriodEnd);

      const areaForecast = {
        name: area,
        periodEnd: latestItem.valid_period.end,
        periodStart: latestItem.valid_period.start,
        type: null
      };

      if (redisLastFetchedPeriodEnd === dateFormat(latestItem.valid_period.end, 'HHMM')) {
        // No timing updates, ignore.
      } else if (latestForecast.match(/Thunder/i) && previousForecast.match(/Thunder/i)) {
        areaForecast.type = CHANGETYPE.EXTENDED;
      } else if (latestForecast.match(/Thunder/i)) {
        areaForecast.type = CHANGETYPE.NOWCATONE;
      } else if (previousForecast.match(/Thunder/i)) {
        areaForecast.type = CHANGETYPE.WASCATONE;
      }

      console.log(`[${area}] '${previousForecast}' (until ${redisLastFetchedPeriodEnd}) => '${latestForecast}' (until ${validPeriodEnd}) === ${areaForecast.type}`);

      if (areaForecast.type) {
        areaForecastMap[area] = areaForecast;

        const chatIds = await lrange(area, 0, -1);
        chatIds.forEach(chatIdsSet.add.bind(chatIdsSet));
      }
    }

    const formatFunc = (af) => `- ${af.name}`;

    for (const chatId of chatIdsSet) {
      const chatIdAreas = (await lrange(chatId, 0, -1))
        .filter((area) => area in areaForecastMap)
        .map((area) => areaForecastMap[area]);
      const nowAFs = chatIdAreas.filter((area) => area.type === CHANGETYPE.NOWCATONE);
      const wasAFs = chatIdAreas.filter((area) => area.type === CHANGETYPE.WASCATONE);
      const extAFs = chatIdAreas.filter((area) => area.type === CHANGETYPE.EXTENDED);

      let text = '';
      if (nowAFs.length > 0) {
        text += `Cat 1 started (until ${dateFormat(nowAFs[0].periodEnd, 'HHMM')})\n*${nowAFs.map(formatFunc).join('\n')}*\n`;
      }

      if (wasAFs.length > 0) {
        text += `Cat 1 downgraded (since ${dateFormat(wasAFs[0].periodStart, 'HHMM')})\n*${wasAFs.map(formatFunc).join('\n')}*\n`;
      }

      if (extAFs.length > 0) {
        text += `Cat 1 extended (until ${dateFormat(extAFs[0].periodEnd, 'HHMM')})\n*${extAFs.map(formatFunc).join('\n')}*\n`;
      }

      if (text.length > 0) {
        bot.sendMessage(chatId, text, { parse_mode: 'markdown' });
      }
    }
  }
};
