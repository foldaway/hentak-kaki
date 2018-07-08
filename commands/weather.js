const fetch = require('node-fetch');
const dateFormat = require('dateformat');
const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL || null);
const lrange = promisify(redisClient.lrange).bind(redisClient);
const lpush = promisify(redisClient.lpush).bind(redisClient);
const lrem = promisify(redisClient.lrem).bind(redisClient);

/* eslint-disable camelcase */

const OPTIONS = [
  'Check a sector',
  'Subscribe to a sector',
  'Unsubscribe from a sector',
  'View subscriptions',
  'Cancel'
];

module.exports = {
  manualSceneHandling: true,
  initialHandler: async (ctx) => {
    const message = await ctx.reply('Choose an action.', {
      reply_markup: {
        keyboard: OPTIONS.map((text) => [{ text }]),
        one_time_keyboard: true,
        selective: true
      }
    });
    ctx.scene.state.prevMessage = message;
  },
  responseHandler: async (ctx) => {
    const today = new Date();
    const arg = ctx.message.text;

    ctx.replyWithChatAction('typing');

    const { area_metadata, items } = await fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`)
      .then(r => r.json());

    const { prevMessage } = ctx.scene.state;
    if (prevMessage) {
      ctx.tg.deleteMessage(ctx.chat.id, prevMessage.message_id);
    }

    switch (OPTIONS.indexOf(ctx.scene.state.stage)) {
      case -1: { // User chose action button
        if (OPTIONS.indexOf(arg) !== -1) {
          ctx.scene.state.stage = arg;
        }
        switch (OPTIONS.indexOf(arg)) {
          case 0: {
            const message = await ctx.reply('Select your sector.', {
              reply_markup: {
                keyboard: area_metadata.map((area) => [{
                  text: area.name
                }]),
                one_time_keyboard: true,
                force_reply: true,
                selective: true
              }
            });
            ctx.scene.state.prevMessage = message;
            break;
          }
          case 1: {
            const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
            const message = await ctx.reply('Select your sector.', {
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
            ctx.scene.state.prevMessage = message;
            break;
          }
          case 2: {
            const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
            if (subscribedSectors.length === 0) {
              ctx.reply('You are not subscribed to any sectors');
              ctx.scene.leave();
              return;
            }
            const message = await ctx.reply('Select a sector to unsubscribe from.', {
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
            ctx.scene.state.prevMessage = message;
            break;
          }
          case 3: { // View
            const subscribedSectors = await lrange(ctx.chat.id, 0, -1);
            if (subscribedSectors.length === 0) {
              ctx.reply('You are not subscribed to any sectors');
              ctx.scene.leave();
              return;
            }
            ctx.replyWithMarkdown(
              subscribedSectors
                .reverse()
                .map((sector) => `*- ${sector}*`)
                .join('\n'),
              { reply_to_message_id: ctx.update.message.message_id }
            );
            ctx.scene.leave();
            break;
          }
          case 4: {
            ctx.reply('Action cancelled');
            ctx.scene.leave();
            break;
          }
          default: {
            ctx.reply('Unknown choice');
            ctx.scene.leave();
            break;
          }
        }
        break;
      }
      case 0: { // Check
        ctx.scene.leave();
        const latestItem = items[items.length - 1];
        const periodEnd = dateFormat(latestItem.valid_period.end, 'HHMM');
        const relevantForecast = latestItem.forecasts
          .find((forecast) => forecast.area === arg) || null;

        if (relevantForecast === null) {
          ctx.replyWithMarkdown(
            'Invalid sector',
            {
              reply_to_message_id: ctx.update.message.message_id,
              reply_markup: { remove_keyboard: true, selective: true }
            }
          );
          return;
        }

        const isCatOne = relevantForecast.forecast.match(/Thunder/i);

        ctx.replyWithMarkdown(
          `*${isCatOne ? '' : 'Not'}* Cat 1 (valid until ${periodEnd})`,
          {
            reply_to_message_id: ctx.update.message.message_id,
            reply_markup: { remove_keyboard: true, selective: true }
          }
        );
        break;
      }
      case 1: { // Subscribe
        await lpush(ctx.chat.id, arg);
        await lpush(arg, ctx.chat.id);

        ctx.reply(
          'Subscribed.',
          {
            reply_to_message_id: ctx.update.message.message_id,
            reply_markup: { remove_keyboard: true, selective: true }
          }
        );
        ctx.scene.leave();
        break;
      }
      case 2: { // Unsub
        ctx.scene.leave();
        const subscribedSectors = await lrange(ctx.chat.id, 0, -1);

        if (subscribedSectors.indexOf(arg) === -1) {
          ctx.replyWithMarkdown(
            'Unknown sector. Action cancelled.',
            {
              reply_to_message_id: ctx.update.message.message_id,
              reply_markup: { remove_keyboard: true, selective: true }
            }
          );
          return;
        }

        await lrem(ctx.chat.id, 0, arg);
        await lrem(arg, 0, ctx.chat.id);

        ctx.reply(
          'Unsubscribed.',
          {
            reply_to_message_id: ctx.update.message.message_id,
            reply_markup: { remove_keyboard: true, selective: true }
          }
        );
        break;
      }
      default: {
        break;
      }
    }
  }
};
