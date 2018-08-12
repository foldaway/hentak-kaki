const fetch = require('node-fetch');
const dateFormat = require('dateformat');
const redis = require('redis');
const Telegram = require('telegraf/telegram');
const { promisify } = require('util');

const models = require('../models');

const redisClient = redis.createClient(process.env.REDIS_URL || null);
const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);

const KEY_LATEST_UPDATE_TIMESTAMP = 'WEATHER_LATEST_UPDATE_TIMESTAMP';

const CHANGETYPE = {
  WASCATONE: 'WASCATONE',
  NOWCATONE: 'NOWCATONE',
  EXTENDED: 'EXTENDED'
};

/* eslint-disable camelcase, no-await-in-loop */

const bot = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

const func = async () => {
  const today = new Date();
  const url = `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`;
  console.log(`Fetching '${url}'`);
  const { area_metadata, items } = await fetch(url)
    .then(r => r.json());

  const areas = area_metadata.map((area) => area.name);
  for (const area of areas) {
    await models.Sector.findOrCreate({
      where: {
        name: area
      }
    });
  }

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

  console.log(`Processing ${areas.length} areas`);

  for (const area of areas) {
    const [sector] = await models.Sector.findOrCreate({
      where: {
        name: area
      }
    });

    const latestForecast = latestItem.forecasts
      .find((forecast) => forecast.area === area).forecast;
    const previousForecast = previousItem.forecasts
      .find((forecast) => forecast.area === area).forecast;

    const lastFetchedPeriodEnd = await sector.get('latest_forecast_period_end');
    const validPeriodEnd = dateFormat(latestItem.valid_period.end, 'HHMM');

    await sector.set('previous_forecast', previousForecast);
    await sector.set('previous_forecast_period_end', previousItem.valid_period.end);
    await sector.set('latest_forecast', latestForecast);
    await sector.set('latest_forecast_period_end', latestItem.valid_period.end);
    await sector.save();

    const areaForecast = {
      name: area,
      periodEnd: latestItem.valid_period.end,
      periodStart: latestItem.valid_period.start,
      type: null
    };

    if (dateFormat(lastFetchedPeriodEnd, 'HHMM') === validPeriodEnd &&
      previousForecast === latestForecast) {
      // No timing updates, ignore.
    } else if (latestForecast.match(/Thunder/i) && previousForecast.match(/Thunder/i)) {
      areaForecast.type = CHANGETYPE.EXTENDED;
    } else if (latestForecast.match(/Thunder/i)) {
      areaForecast.type = CHANGETYPE.NOWCATONE;
    } else if (previousForecast.match(/Thunder/i)) {
      areaForecast.type = CHANGETYPE.WASCATONE;
    }

    console.log(`[${area}] '${previousForecast}' (until ${dateFormat(lastFetchedPeriodEnd, 'HHMM')}) => '${latestForecast}' (until ${validPeriodEnd}) === ${areaForecast.type}`);

    if (areaForecast.type) {
      areaForecastMap[area] = areaForecast;
    }
  }

  const formatFunc = (af) => `- ${af.name}`;

  const subscribers = await models.Subscriber.findAll();

  for (const subscriber of subscribers) {
    const chatIdAreas = (await models.Subscription.findAll({
      where: {
        subscriber_id: subscriber.id
      }
    })).map((subscription) => subscription.getSector().get('name'))
      .filter((sectorName) => sectorName in areaForecastMap);

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
      bot.sendMessage(subscriber.get('chat_id'), text, { parse_mode: 'markdown' });
    }
  }
};

func().then(() => process.exit());
