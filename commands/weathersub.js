const fetch = require('node-fetch');
const dateFormat = require('dateformat');
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL || null);
const lrange = promisify(redisClient.lrange).bind(redisClient);
const lpush = promisify(redisClient.lpush).bind(redisClient);

/* eslint-disable camelcase */

module.exports = {
  initialHandler: async (ctx) => {
    ctx.replyWithChatAction('typing');

    const today = new Date();
    const url = `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`;
    console.log(`Fetching '${url}'`);
    const { area_metadata } = await fetch(url)
      .then(r => r.json());
    const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
    ctx.reply('Select a sector to subscribe to.', {
      reply_markup: {
        keyboard: area_metadata
          .filter((area) => subscribedSectors.indexOf(area.name) === -1)
          .map((area) => [{
            text: area.name
          }]),
        one_time_keyboard: true,
        force_reply: true,
        selective: true
      }
    });
  },
  responseHandler: async (ctx) => {
    const arg = ctx.message.text;

    await lpush(ctx.chat.id, arg);
    await lpush(arg, ctx.chat.id);

    ctx.replyWithMarkdown(
      `subscribed to '${arg}'`,
      {
        reply_to_message_id: ctx.update.message.message_id,
        reply_markup: { remove_keyboard: true, selective: true }
      }
    );
  }
};
