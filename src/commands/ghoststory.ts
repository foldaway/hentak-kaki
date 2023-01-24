import { flatten, sample } from 'lodash';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import Snoowrap from 'snoowrap';

const r = new Snoowrap({
  userAgent:
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

const submissions = ['5iajz7', '4ovtw1', '54pxf7', '86z0av', '86syoy'];

const GhostStoryCommand: App.CommandDefinition = {
  name: 'ghoststory',
  initialState: undefined,
  stages: [
    {
      type: 'text',
      trigger: {
        type: 'command',
      },
      async handle() {
        const responses = await Promise.all(
          submissions.map((id) => r.getSubmission(id).comments)
        );
        const comments = flatten(responses);
        const comment = sample(comments);

        if (comment == null) {
          return {
            responses: [
              {
                type: 'text',
                text: 'Could not fetch comments',
              },
            ],
          };
        }

        const text = NodeHtmlMarkdown.translate(comment.body, {
          strongDelimiter: '*',
        });

        return {
          responses: [
            {
              type: 'text',
              text: `
*${comment.author.name}:*
${text}
  `,
            },
          ],
        };
      },
    },
  ],
};

export default GhostStoryCommand;
