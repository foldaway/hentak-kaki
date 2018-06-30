const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL || null);
const lrange = promisify(redisClient.lrange).bind(redisClient);
const lrem = promisify(redisClient.lrem).bind(redisClient);

/* eslint-disable camelcase */

module.exports = {
  initialHandler: async (ctx) => {
    const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
    if (subscribedSectors.length === 0) {
      ctx.reply('You are not subscribed to any sectors');
      return;
    }
    ctx.reply('Select a sector to unsubscribe from.', {
      reply_markup: {
        keyboard: subscribedSectors
          .reverse()
          .map((area) => [{
            text: area
          }]),
        one_time_keyboard: true,
        force_reply: true,
        selective: true
      }
    });
  },
  responseHandler: async (ctx) => {
    const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
    const arg = ctx.message.text;

    if (subscribedSectors.indexOf(arg) === -1) {
      ctx.replyWithMarkdown(
        'Unknown sector. Action cancelled.',
        { reply_to_message_id: ctx.update.message.message_id }
      );
      return;
    }

    await lrem(ctx.chat.id, 0, arg);
    await lrem(arg, 0, ctx.chat.id);

    ctx.replyWithMarkdown(
      `unsubscribed from '${arg}'`,
      { reply_to_message_id: ctx.update.message.message_id }
    );
  }
};
