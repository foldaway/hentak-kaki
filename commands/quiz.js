module.exports = {
  initialHandler: (ctx) => {
    ctx.reply('Pick your poison.', {
      reply_markup: {
        keyboard: [
          [{ text: 'BMT' }],
          [{ text: 'SCS' }],
          [{ text: 'OCS' }]
        ]
      }
    });
  },
  responseHandlers: {
    BMT: (ctx) => ctx.reply('REC want quiz ans eh'),
    SCS: (ctx) => ctx.reply('SCT want quiz ans eh'),
    OCS: (ctx) => ctx.reply('OCT want quiz ans eh')
  },
  responseHandler: (ctx) => ctx.reply('wat')
};
