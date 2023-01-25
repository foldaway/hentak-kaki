import { flatten, sample, sampleSize } from 'lodash';
import { NodeHtmlMarkdown } from 'node-html-markdown';

import fetchRedditComments, {
  RedditComment,
  RedditListing,
} from '../util/fetchRedditComments';

const submissions = [
  '8r475u', // 02/18
  '84rjsk', // 01/18
  '7jw0fh', // 04/17
  '7039qd', // 03/17
  '6hfbvk', // 02/17
];

// const hasBodyText = comment => 'body' in comment.data || 'body_html' in comment.data;
const hasReplies = (
  comment: RedditComment
): comment is RedditComment & { replies: RedditListing } => {
  const { replies } = comment.data;

  if (replies == null || typeof replies === 'string') {
    return false;
  }

  return replies.data.children.length > 0;
};

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
        const hasArgument = (comment: RedditComment) =>
          new RegExp(`${argument}\\b`, 'i').test(comment.data.body);

        const responses: RedditComment[] = [];

        for (const submissionId of submissions) {
          responses.push(...(await fetchRedditComments(submissionId)));
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const feedListings = flatten(responses);
        const relevantComments = feedListings
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
        console.log(`[VOCATION] Chosen ${chosenComment.data.permalink}`);

        const sampleReplies = sampleSize(
          chosenComment.replies.data.children,
          5
        );

        const text = NodeHtmlMarkdown.translate(chosenComment.data.body, {
          strongDelimiter: '*',
        });

        return {
          responses: [
            {
              type: 'text',
              text: `*OP*: _${text}_
  
${sampleReplies
  .map((reply) => `*/u/${reply.data.author}:* ${reply.data.body}`)
  .join('\n')}`,
            },
          ],
        };
      },
    },
  ],
};

export default VocationCommand;
