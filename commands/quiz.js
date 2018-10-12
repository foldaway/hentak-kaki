module.exports = {
  initialHandler: (ctx) => {
    ctx.reply('Pick your poison.', {
      reply_markup: {
        keyboard: [
          [{ text: 'BMT' }],
          [{ text: 'SCS' }],
          [{ text: 'OCS' }]
        ],
        one_time_keyboard: true,
        selective: true,
        resize_keyboard: true
      },
      reply_to_message_id: ctx.update.message.message_id
    });
  },
  responseHandlers: {
    BMT: (ctx) => ctx.reply('REC want quiz ans eh'),
    SCS: (ctx) => ctx.reply('SCT want quiz ans eh'),
    OCS: (ctx) => ctx.reply('OCT want quiz ans eh')
  },
  responseHandler: (ctx) => ctx.reply('wat')
};
