const fetch = require('node-fetch');

const TurndownService = require('turndown');
const turndownService = new TurndownService({
  strongDelimiter: '*'
});

const urls = [
  'https://www.reddit.com/r/singapore/comments/5iajz7/share_your_scary_ns_storiesexperiences.json',
  'https://www.reddit.com/r/singapore/comments/4ovtw1/come_share_your_ghostsupernatural_stories.json',
  'https://www.reddit.com/r/singapore/comments/54pxf7/scariest_ns_ghost_stories.json'
];

const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = async (ctx) => {
  ctx.replyWithChatAction('typing');
  const responses = await Promise.all(urls.map(url => fetch(url)
    .then(r => r.json())
    .then(data => data[1].data.children)));
  const comments = responses.reduce((a, b) => a.concat(b))
    .filter(comment => 'body' in comment.data || 'body_html' in comment.data);
  const comment = arraySample(comments);
  ctx.replyWithMarkdown(`
*${comment.data.author}:*
${turndownService.turndown(comment.data.body || comment.data.body_html)}
  `, { reply_to_message_id: ctx.update.message.message_id });
};
