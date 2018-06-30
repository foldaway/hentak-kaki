const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL || null);
const lrange = promisify(redisClient.lrange).bind(redisClient);

/* eslint-disable camelcase */

module.exports = {
  initialHandler: async (ctx) => {
    const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
    if (subscribedSectors.length === 0) {
      ctx.reply('You are not subscribed to any sectors');
      return;
    }
    ctx.replyWithMarkdown(
      `You are subscribed to:\n${subscribedSectors.reverse().join('\n')}`,
      { reply_to_message_id: ctx.update.message.message_id }
    );
  },
  responseHandler: () => {}
};
