import axios from 'axios';

export interface RedditListing {
  kind: 'Listing';
  children: RedditComment[];
}

export interface RedditComment {
  kind: 't1';
  data: {
    id: string;
    author: string;
    body: string;
    body_html: string;
    replies: RedditListing | '';
    permalink: string;
  };
}

type Response = [RedditListing, RedditListing];

export default async function fetchRedditComments(
  submissionId: string
): Promise<RedditComment[]> {
  const response = await axios.get<Response>(
    `https://reddit.com/${submissionId}.json`
  );

  return response.data[1].children;
}
