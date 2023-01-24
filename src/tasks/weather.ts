import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DateTime } from 'luxon';
import TelegramBot from 'node-telegram-bot-api';

import { getAllSubscribers } from '../db/getAllSubscribers';
import { TableNameCache, TableNameSector } from '../db/tableNames';
import fetchWeatherData from '../util/fetchWeatherData';

const { NODE_ENV, TELEGRAM_BOT_TOKEN } = process.env;

const CACHE_KEY_LATEST_UPDATE_TIMESTAMP = 'WEATHER_LATEST_UPDATE_TIMESTAMP';

interface CacheValue {
  timestamp: Date;
}

const client = new DynamoDBClient({});
const db = DynamoDBDocument.from(client);

async function getCacheValue(): Promise<CacheValue | null> {
  const cachedLatestUpdateTimestampQuery = await db.get({
    TableName: TableNameCache,
    Key: {
      id: CACHE_KEY_LATEST_UPDATE_TIMESTAMP,
    },
  });

  return (cachedLatestUpdateTimestampQuery.Item ?? null) as CacheValue | null;
}

export default async function checkWeatherAndNotify() {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('Missing env vars!');
  }

  const response = await fetchWeatherData();
  const { area_metadata, items } = response;

  const sectorMap: Record<string, DB.Sector> = {};
  const sectorNamesWithUpdates = new Set<string>();

  const areas = area_metadata.map((area) => area.name);
  for (const area of areas) {
    const { Item: existingSector } = await db.get({
      TableName: TableNameSector,
      Key: {
        name: area,
      },
    });

    sectorMap[area] = existingSector as DB.Sector;

    if (existingSector == null) {
      const newSector: DB.Sector = {
        name: area,
        apiCache: null,
        status: null,
      };

      await db.put({
        TableName: TableNameSector,
        Item: newSector,
      });

      sectorMap[area] = newSector;
    }
  }

  if (items.length <= 2) {
    console.log('Not enough items to compare');
    return;
  }

  const latestItem = items[items.length - 1];
  const previousItem = items[items.length - 2];

  const cachedLatestUpdateTimestamp = await getCacheValue();

  if (latestItem.update_timestamp === cachedLatestUpdateTimestamp?.timestamp) {
    console.log(
      `Last update timestamp (${latestItem.update_timestamp}) identical, terminating.`
    );
    return;
  }

  const newCacheValue: CacheValue = {
    timestamp: latestItem.update_timestamp,
  };

  await db.put({
    TableName: TableNameCache,
    Item: newCacheValue,
  });

  console.log(`Processing ${areas.length} areas`);

  for (const area of areas) {
    const sector = sectorMap[area];

    const latestForecast = latestItem.forecasts.find(
      (forecast) => forecast.area === area
    )?.forecast;
    const previousForecast = previousItem.forecasts.find(
      (forecast) => forecast.area === area
    )?.forecast;

    if (latestForecast == null || previousForecast == null) {
      console.log('Cannot process without previous and latest forecast');
      continue;
    }

    const lastFetchedPeriodEnd = sector.apiCache?.latestForecastPeriodEnd;
    const validPeriodEnd = DateTime.fromJSDate(
      latestItem.valid_period.end
    ).toFormat('HHMM');

    const sectorAPICache: DB.SectorAPICache = {
      previousForecast,
      previousForecastPeriodEnd: previousItem.valid_period.end,
      previousForecastPeriodStart: previousItem.valid_period.start,
      latestForecast,
      latestForecastPeriodEnd: latestItem.valid_period.end,
      latestForecastPeriodStart: latestItem.valid_period.start,
    };

    let sectorForecast: DB.SectorStatus = null;

    if (
      DateTime.fromJSDate(lastFetchedPeriodEnd ?? new Date()).toFormat(
        'HHMM'
      ) === validPeriodEnd &&
      previousForecast === latestForecast
    ) {
      // No timing updates, ignore.
    } else if (
      latestForecast.match(/Thunder/i) &&
      previousForecast.match(/Thunder/i)
    ) {
      sectorForecast = 'extended';
    } else if (latestForecast.match(/Thunder/i)) {
      sectorForecast = 'now_cat_one';
    } else if (previousForecast.match(/Thunder/i)) {
      sectorForecast = 'was_cat_one';
    }

    // Update sector
    const newSector: DB.Sector = {
      ...sector,
      apiCache: sectorAPICache,
      status: sectorForecast,
    };

    await db.put({
      TableName: TableNameSector,
      Item: newSector,
    });

    sectorMap[area] = newSector;

    console.log(
      `[${area}] '${previousForecast}' (until ${DateTime.fromJSDate(
        lastFetchedPeriodEnd ?? new Date()
      ).toFormat(
        'HHMM'
      )}) => '${latestForecast}' (until ${validPeriodEnd}) === ${sectorForecast}`
    );

    if (sectorForecast != null) {
      sectorNamesWithUpdates.add(area);
    }
  }

  const subscribers = await getAllSubscribers();

  console.log(`Processing ${subscribers.length} subscribers.`);

  const options: TelegramBot.ConstructorOptions = {};

  const isProduction = NODE_ENV === 'production';

  if (!isProduction) {
    options.polling = true;
    console.log('Polling...');
  }

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, options);

  for (const subscriber of subscribers) {
    const subscriberSectorNames = new Set(subscriber.sectorNames);

    const subscriberSectorsWithUpdates = Array.from(
      sectorNamesWithUpdates
    ).filter((sectorName) => {
      return subscriberSectorNames.has(sectorName);
    });

    console.log(
      `Subscriber ${subscriber.chatId} to notify: ${subscriberSectorsWithUpdates.length}`
    );

    const nowSectorNames = subscriberSectorsWithUpdates.filter(
      (sectorName) => sectorMap[sectorName].status === 'now_cat_one'
    );
    const wasSectorNames = subscriberSectorsWithUpdates.filter(
      (sectorName) => sectorMap[sectorName].status === 'was_cat_one'
    );
    const extSectorNames = subscriberSectorsWithUpdates.filter(
      (sectorName) => sectorMap[sectorName].status === 'extended'
    );

    let text = '';
    if (nowSectorNames.length > 0) {
      text += `Cat 1 started (until ${DateTime.fromJSDate(
        sectorMap[nowSectorNames[0]].apiCache?.latestForecastPeriodEnd ??
          new Date()
      ).toFormat('HHMM')})\n*${nowSectorNames.join('\n')}*\n`;
    }

    if (wasSectorNames.length > 0) {
      text += `Cat 1 downgraded (since ${DateTime.fromJSDate(
        sectorMap[wasSectorNames[0]].apiCache?.latestForecastPeriodEnd ??
          new Date()
      ).toFormat('HHMM')})\n*${wasSectorNames.join('\n')}*\n`;
    }

    if (extSectorNames.length > 0) {
      text += `Cat 1 extended (until ${DateTime.fromJSDate(
        sectorMap[extSectorNames[0]].apiCache?.latestForecastPeriodEnd ??
          new Date()
      ).toFormat('HHMM')})\n*${extSectorNames.join('\n')}*\n`;
    }

    if (text.length > 0) {
      console.log(
        `[${subscriber.chatId}] Notifying of now=${nowSectorNames.length} was=${wasSectorNames.length} ext=${extSectorNames.length}`
      );
      await bot.sendMessage(subscriber.chatId, text, {
        parse_mode: 'Markdown',
      });
    } else {
      console.log(`[${subscriber.chatId}] Nothing to notify`);
    }
  }
}
