import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

import { TableNameSubscriber } from './tableNames';

const client = new DynamoDBClient({});
const db = DynamoDBDocument.from(client);

export async function getAllSubscribers(): Promise<DB.Subscriber[]> {
  const subscribers: DB.Subscriber[] = [];

  let ExclusiveStartKey: any = undefined;

  do {
    const query = await db.scan({
      TableName: TableNameSubscriber,
      ExclusiveStartKey,
    });

    ExclusiveStartKey = query.LastEvaluatedKey;

    subscribers.push(...(query.Items as DB.Subscriber[]));
  } while (ExclusiveStartKey != null);

  return subscribers;
}
