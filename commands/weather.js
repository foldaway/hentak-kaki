const fetch = require('node-fetch');
const dateFormat = require('dateformat');

/* eslint-disable camelcase */

module.exports = {
  initialHandler: async (ctx) => {
    const today = new Date();
    const url = `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`;
    console.log(`Fetching '${url}'`);
    const { area_metadata } = await fetch(url)
      .then(r => r.json());
    ctx.reply('Select your sector.', {
      reply_markup: {
        keyboard: area_metadata.map((area) => [{
          text: area.name
        }]),
        one_time_keyboard: true,
        force_reply: true,
        selective: true
      }
    });
  },
  responseHandler: async (ctx) => {
    const today = new Date();
    const arg = ctx.message.text;
    const { items } = await fetch(`https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${dateFormat(today, 'yyyy-mm-dd')}`)
      .then(r => r.json());
    const latestItem = items[items.length - 1];
    const periodEnd = dateFormat(latestItem.valid_period.end, 'HHMM');
    const relevantForecast = latestItem.forecasts.find((forecast) => forecast.area === arg);

    if (relevantForecast === null) {
      ctx.replyWithMarkdown(
        'Invalid sector',
        { reply_to_message_id: ctx.update.message.message_id }
      );
      return;
    }

    const isCatOne = relevantForecast.forecast.match(/Thunder/i);

    ctx.replyWithMarkdown(
      `*${isCatOne ? '' : 'Not'}* Cat 1 (valid until ${periodEnd})`,
      { reply_to_message_id: ctx.update.message.message_id }
    );
  }
};
