const fetch = require('node-fetch');
const pry = require('pryjs');

const feeds = [
  'https://www.reddit.com/r/singapore/comments/84rjsk/ns_posting_0318.json', // 01/18
  'https://www.reddit.com/r/singapore/comments/7jw0fh/ns_postings_0517.json', // 04/17
  'https://www.reddit.com/r/singapore/comments/7039qd/ns_postings_0317.json', // 03/17
  'https://www.reddit.com/r/singapore/comments/6hfbvk/ns_postings_0217.json' // 02/17
];

const hasBodyText = comment => 'body' in comment.data;
const hasReplies = comment => comment.data.replies &&
  comment.data.replies.data.children.length > 0 &&
  comment.data.replies.data.children[0].kind !== 'more'; // More comments. Don't bother to expand.
const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = async (ctx) => {
  const argument = ctx.message.text.split(' ').splice(1).join(' ');
  const hasArgument = comment => comment.data.body.toLowerCase()
    .indexOf(argument.toLowerCase()) > -1;

  ctx.replyWithChatAction('typing');
  const responses = await Promise.all(feeds.map(url => fetch(url)
    .then(r => r.json())
    .then(data => data[1].data.children)));
  const feedComments = responses.reduce((a, b) => a.concat(b));
  // eval(pry.it)
  const relevantComments = feedComments
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
