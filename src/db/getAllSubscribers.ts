import { DynamoDB } from 'aws-sdk';

import { TableNameSubscriber } from './tableNames';

const db = new DynamoDB.DocumentClient();

export async function getAllSubscribers(): Promise<DB.Subscriber[]> {
  const subscribers: DB.Subscriber[] = [];

  let ExclusiveStartKey: any = undefined;

  do {
    const query = await db
      .scan({
        TableName: TableNameSubscriber,
        ExclusiveStartKey,
      })
      .promise();

    ExclusiveStartKey = query.LastEvaluatedKey;

    subscribers.push(...(query.Items as DB.Subscriber[]));
  } while (ExclusiveStartKey != null);

  return subscribers;
}
