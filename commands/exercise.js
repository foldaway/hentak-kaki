module.exports = {
  initialHandler: (ctx) => {
    ctx.reply('What kind of exercise:', {
      reply_markup: {
        keyboard: [
          [{ text: '5BX' }],
          [{ text: 'SAF Warm Ups' }]
        ],
        one_time_keyboard: true,
        selective: true
      }
    });
  },

  responseHandlers: {
    '5BX': (ctx) => ctx.replyWithMarkdown(`
*5BX:*
1. Jumping Jacks
2. High Jumper
3. Crunches
4. Push up
5. Run
`, {
      reply_to_message_id: ctx.update.message.message_id,
      reply_markup: { remove_keyboard: true, selective: true }
    }),

    'SAF Warm Ups': (ctx) => ctx.replyWithMarkdown(`
*SAF Warm Ups:*
1. Jogging on the Spot
2. Jumping Jacks
3. Pectoral Stretch
4. High Jumper
5. Side Stretch
6. Quad Stretch
7. Hamstring Stretch
8. Calf Stretch
`, {
      reply_to_message_id: ctx.update.message.message_id,
      reply_markup: { remove_keyboard: true, selective: true }
    })
  },
  responseHandler: (ctx) => ctx.reply('Knock it down', {
    reply_to_message_id: ctx.update.message.message_id,
    reply_markup: { remove_keyboard: true, selective: true }
  })
};
