import { flatten, sample } from 'lodash';
import { NodeHtmlMarkdown } from 'node-html-markdown';

import fetchRedditComments, {
  RedditComment,
} from '../util/fetchRedditComments';

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
        const responses: RedditComment[] = [];

        for (const submissionId of submissions) {
          responses.push(...(await fetchRedditComments(submissionId)));
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

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

        const text = NodeHtmlMarkdown.translate(comment.data.body, {
          strongDelimiter: '*',
        });

        return {
          responses: [
            {
              type: 'text',
              text: `
*${comment.data.author}:*
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
