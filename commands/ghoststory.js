const Snoowrap = require('snoowrap');

const TurndownService = require('turndown');
const turndownService = new TurndownService({
  strongDelimiter: '*'
});

const r = new Snoowrap({
  userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
});

const submissions = [
  '5iajz7',
  '4ovtw1',
  '54pxf7',
  '86z0av'
];

const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = async (ctx) => {
  ctx.replyWithChatAction('typing');
  const responses = await Promise.all(submissions.map(id => r.getSubmission(id).comments));
  const comments = responses.reduce((a, b) => a.concat(b));
  const comment = arraySample(comments);
  ctx.replyWithMarkdown(`
*${comment.author.name}:*
${turndownService.turndown(comment.body)}
  `, { reply_to_message_id: ctx.update.message.message_id });
};
