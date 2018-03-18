module.exports = (ctx) => {
   ctx.replyWithMarkdown(`
    *SAF Warm Ups:*
    1. Jogging on the Spot
    2. Jumping Jacks
    3. Pectoral Stretch
    4. High Jumper
    5. Side Stretch
    6. Quad Stretch
    7. Hamstring Stretch
    8. Calf Stretch
    `), {
	reply_to_message_id: ctx.update.message.message_id
    };
}