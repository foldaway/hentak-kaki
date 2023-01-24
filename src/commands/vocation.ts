import { flatten, sample } from 'lodash';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import Snoowrap, { Comment } from 'snoowrap';

const r = new Snoowrap({
  userAgent:
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

const submissions = [
  '8r475u', // 02/18
  '84rjsk', // 01/18
  '7jw0fh', // 04/17
  '7039qd', // 03/17
  '6hfbvk', // 02/17
];

// const hasBodyText = comment => 'body' in comment.data || 'body_html' in comment.data;
const hasReplies = (comment: Comment) =>
  comment.replies && comment.replies.length > 0;

const VocationCommand: App.CommandDefinition = {
  name: 'vocation',
  initialState: undefined,
  stages: [
    {
      type: 'text',
      trigger: {
        type: 'command',
      },
      async handle() {
        return {
          responses: [
            {
              type: 'text',
              text: 'Type a vocation. _E.g. MP, Guards_',
              options: {
                reply_markup: {
                  force_reply: true,
                  selective: true,
                },
              },
            },
          ],
        };
      },
    },
    {
      type: 'text',
      trigger: {
        type: 'text',
      },
      async handle(msg) {
        const argument = msg.text;
        console.log(`[VOCATION] Searching for '${argument}'`);
        const hasArgument = (comment: { body: string }) =>
          new RegExp(`${argument}\\b`, 'i').test(comment.body);

        const responses = await Promise.all(
          submissions.map((id) => r.getSubmission(id).comments)
        );
        const feedComments = flatten(responses);
        const relevantComments = feedComments
          .filter(hasArgument)
          .filter(hasReplies);

        const chosenComment = sample(relevantComments);

        if (chosenComment == null) {
          return {
            responses: [
              {
                type: 'text',
                text: 'No advice :(',
              },
            ],
          };
        }
        console.log(`[VOCATION] Chosen ${chosenComment.permalink}`);
        const sampleReplies = chosenComment.replies
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);

        const text = NodeHtmlMarkdown.translate(chosenComment.body, {
          strongDelimiter: '*',
        });

        return {
          responses: [
            {
              type: 'text',
              text: `*OP*: _${text}_
  
${sampleReplies
  .map((reply) => `*/u/${reply.author.name}:* ${reply.body}`)
  .join('\n')}`,
            },
          ],
        };
      },
    },
  ],
};

export default VocationCommand;
