module.exports = async (ctx) => {
  const chat = await ctx.telegram.getChat(ctx.message.chat.id);
  const args = ctx.message.text.split(' ');
  const { pinned_message } = chat;
  const { message_id } = pinned_message;

  if (args.length === 1) {
    const { text } = pinned_message;

    ctx.telegram.sendMessage(ctx.message.chat.id, `
      /bulletin: Edit and pin new bulletin message
      `, {
      reply_to_message_id: ctx.update.message.message_id,
      reply_markup: { force_reply: true, selective: true }
    });

    return;
  }

  const newBulletinMessageText = args.splice(1).join(' ');
  const newBulletinMessage = await ctx.reply(newBulletinMessageText);
  setTimeout(() => ctx.pinChatMessage(newBulletinMessage.message_id), 100);
};
