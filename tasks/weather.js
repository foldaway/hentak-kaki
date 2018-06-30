const fetch = require('node-fetch');
const dateFormat = require('dateformat');
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient();
const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const lrange = promisify(redisClient.lrange).bind(redisClient);
const hget = promisify(redisClient.hget).bind(redisClient);
const hset = promisify(redisClient.hset).bind(redisClient);

const KEY_LATEST_UPDATE_TIMESTAMP = 'WEATHER_LATEST_UPDATE_TIMESTAMP';
const KEY_LAST_FETCH_UPDATE_FORECASTS = 'WEATHER_LAST_FETCH_UPDATE_FORECASTS';

/* eslint-disable camelcase, no-await-in-loop */

module.exports = {
  cron: '*/2   *   *   *   *',
  func: async (bot) => {
    const today = new Date();
    const url = `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`;
    console.log(`Fetching '${url}'`);
    const { area_metadata, items } = await fetch(url)
      .then(r => r.json());

    const areas = area_metadata.map((area) => area.name);

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

    for (const area of areas) {
      const latestForecast = latestItem.forecasts
        .find((forecast) => forecast.area === area).forecast;
      const previousForecast = previousItem.forecasts
        .find((forecast) => forecast.area === area).forecast;

      const redisLastFetchedForecast = hget(KEY_LAST_FETCH_UPDATE_FORECASTS, area);

      console.log(`Checking '${area}'. '${previousForecast}' => '${latestForecast}'`);
      hset(KEY_LAST_FETCH_UPDATE_FORECASTS, area, latestForecast);

      let text = '';

      if (latestForecast.match(/Thunder/i) && (previousForecast === latestForecast || redisLastFetchedForecast === latestForecast)) {
        text = `Cat 1 status extended for *${area}* (until ${dateFormat(latestItem.valid_period.end, 'HHmm')})\n`;
      } else if (latestForecast.match(/Thunder/i)) {
        text = `Lighting risk is now Cat 1 for *${area}* (until ${dateFormat(latestItem.valid_period.end, 'HHmm')})\n`;
      } else if (previousForecast.match(/Thunder/i)) {
        text = `Cat 1 status has been lifted for *${area}*\n`;
      }

      if (text.length > 0) {
        const chatIds = await lrange(area, 0, -1);
        chatIds.forEach((chatId) => bot.sendMessage(chatId, text, { parse_mode: 'markdown' }));
      }
    }
  }
};
