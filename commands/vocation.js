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
  '8r475u', // 02/18
  '84rjsk', // 01/18
  '7jw0fh', // 04/17
  '7039qd', // 03/17
  '6hfbvk' // 02/17
];

// const hasBodyText = comment => 'body' in comment.data || 'body_html' in comment.data;
const hasReplies = comment => comment.replies && comment.replies.length > 0;
const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = {
  initialHandler: async (ctx) => {
    ctx.replyWithMarkdown('Type a vocation. _E.g. MP, Guards_', {
      reply_markup: {
        force_reply: true,
        selective: true
      }
    });
  },
  responseHandler: async (ctx) => {
    ctx.replyWithChatAction('typing');

    const argument = ctx.message.text;
    console.log(`[VOCATION] Searching for '${argument}'`);
    const hasArgument = comment => new RegExp(`${argument}\\b`, 'i').test(comment.body);

    const responses = await Promise.all(submissions.map(id => r.getSubmission(id).comments));
    const feedComments = responses.reduce((a, b) => a.concat(b));
    const relevantComments = feedComments
      .filter(hasArgument)
      .filter(hasReplies);
    if (relevantComments.length === 0) {
      ctx.reply('No advice :(', { reply_to_message_id: ctx.update.message.message_id });
      return;
    }
    const chosenComment = arraySample(relevantComments);
    console.log(`[VOCATION] Chosen ${chosenComment.permalink}`);
    const chosenCommentReplies = chosenComment.replies;

    const chosenCommentReply = arraySample(chosenCommentReplies);
    ctx.replyWithMarkdown(
      `*OP*: _${turndownService.turndown(chosenComment.body)}_
  
*Advice:* ${chosenCommentReply.body}`,
      { reply_to_message_id: ctx.update.message.message_id }
    );
  }
};
