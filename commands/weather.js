const fetch = require('node-fetch');
const dateFormat = require('dateformat');

const models = require('../models');

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
        force_reply: true,
        selective: true,
        resize_keyboard: true
      },
      reply_to_message_id: ctx.update.message.message_id
    });
    ctx.scene.state.prevMessage = message;
  },
  responseHandler: async (ctx) => {
    const today = new Date();
    const arg = ctx.message.text;

    ctx.replyWithChatAction('typing');

    const sectors = await models.Sector.findAll({
      order: ['name']
    });

    const { prevMessage } = ctx.scene.state;
    if (prevMessage) {
      ctx.tg.deleteMessage(ctx.chat.id, prevMessage.message_id);
    }

    const [subscriber] = await models.Subscriber.findOrCreate({
      where: {
        chat_id: `${ctx.chat.id}`
      }
    });

    const subscribedSectors = await models.Sector.findAll({
      include: [{
        model: models.Subscription,
        where: {
          subscriber_id: subscriber.id
        }
      }]
    });

    switch (OPTIONS.indexOf(ctx.scene.state.stage)) {
      case -1: { // User chose action button
        if (OPTIONS.indexOf(arg) !== -1) {
          ctx.scene.state.stage = arg;
        }
        switch (OPTIONS.indexOf(arg)) {
          case 0: {
            const message = await ctx.reply('Select your sector.', {
              reply_markup: {
                keyboard: sectors
                  .map((sector) => sector.name)
                  .map((text) => [{ text }]),
                one_time_keyboard: true,
                force_reply: true,
                selective: true,
                resize_keyboard: true
              },
              reply_to_message_id: ctx.update.message.message_id
            });
            ctx.scene.state.prevMessage = message;
            break;
          }
          case 1: {
            const message = await ctx.reply('Select a sector.', {
              reply_markup: {
                keyboard: sectors
                  .map((sector) => sector.name)
                  .filter((sector) => subscribedSectors.indexOf(sector) === -1)
                  .map((text) => [{ text }]),
                one_time_keyboard: true,
                force_reply: true,
                selective: true,
                resize_keyboard: true
              },
              reply_to_message_id: ctx.update.message.message_id
            });
            ctx.scene.state.prevMessage = message;
            break;
          }
          case 2: {
            if (subscribedSectors.length === 0) {
              ctx.reply('You are not subscribed to any sectors');
              ctx.scene.leave();
              return;
            }
            const message = await ctx.reply('Select a sector to unsubscribe from.', {
              reply_markup: {
                keyboard: subscribedSectors
                  .map((sector) => sector.name)
                  .sort((a, b) => a.localeCompare(b))
                  .map((text) => [{ text }]),
                one_time_keyboard: true,
                force_reply: true,
                selective: true,
                resize_keyboard: true
              },
              reply_to_message_id: ctx.update.message.message_id
            });
            ctx.scene.state.prevMessage = message;
            break;
          }
          case 3: { // View
            if (subscribedSectors.length === 0) {
              ctx.reply('You are not subscribed to any sectors');
              ctx.scene.leave();
              return;
            }
            ctx.replyWithMarkdown(
              subscribedSectors
                .map((sector) => sector.name)
                .sort((a, b) => a.localeCompare(b))
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

        const { items } = await fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`)
          .then(r => r.json());

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
        const sector = await models.Sector.find({
          where: {
            name: arg
          }
        });
        if (sector === null) {
          ctx.reply('Invalid sector');
          ctx.scene.leave();
          break;
        }
        await models.Subscription.findOrCreate({
          where: {
            subscriber_id: subscriber.id,
            sector_id: sector.id
          }
        });

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

        const sector = await models.Sector.find({
          where: {
            name: arg
          }
        });

        if (sector === null || subscribedSectors
          .map((s) => s.name)
          .indexOf(arg) === -1) {
          ctx.replyWithMarkdown(
            'Unknown sector. Action cancelled.',
            {
              reply_to_message_id: ctx.update.message.message_id,
              reply_markup: { remove_keyboard: true, selective: true }
            }
          );
          return;
        }

        const subscription = await models.Subscription.find({
          where: {
            subscriber_id: subscriber.id,
            sector_id: sector.id
          }
        });

        if (subscription === null) {
          ctx.reply(`You are not subscribed to '${arg}'`);
          ctx.scene.leave();
          break;
        }

        await subscription.destroy();

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
