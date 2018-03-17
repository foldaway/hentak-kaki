const fetch = require('node-fetch');

const hasBodyText = comment => 'body' in comment.data;
const hasReplies = comment => comment.data.replies.data.children.length > 0 &&
  comment.data.replies.data.children[0].kind !== 'more'; // More comments. Don't bother to expand.
const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = async (ctx) => {
  const argument = ctx.message.text.split(' ').splice(1).join(' ');
  const hasArgument = comment => comment.data.body.toLowerCase()
    .indexOf(argument.toLowerCase()) > -1;

  ctx.replyWithChatAction('typing');
  const feed = await fetch('https://www.reddit.com/r/singapore/comments/84rjsk/ns_posting_0318.json')
    .then(r => r.json());
  const relevantComments = feed[1].data.children
    .filter(hasBodyText)
    .filter(hasArgument)
    .filter(hasReplies);
  if (relevantComments.length === 0) {
    ctx.reply('No advice :(', { reply_to_message_id: ctx.update.message.message_id });
    return;
  }
  const chosenComment = arraySample(relevantComments);
  const chosenCommentReplies = chosenComment.data.replies.data.children
    .filter(hasBodyText);

  const chosenCommentReply = arraySample(chosenCommentReplies);
  ctx.replyWithMarkdown(
    `*${argument}*:\n${chosenCommentReply.data.body}`,
    { reply_to_message_id: ctx.update.message.message_id }
  );
};
