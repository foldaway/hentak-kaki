import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

import { TableNameSector } from './tableNames';

const client = new DynamoDBClient({});
const db = DynamoDBDocument.from(client);

export async function getAllSectors(): Promise<DB.Sector[]> {
  const sectors: DB.Sector[] = [];

  let ExclusiveStartKey: any = undefined;

  do {
    const query = await db.scan({
      TableName: TableNameSector,
      ExclusiveStartKey,
    });

    ExclusiveStartKey = query.LastEvaluatedKey;

    sectors.push(...(query.Items as DB.Sector[]));
  } while (ExclusiveStartKey != null);

  return sectors;
}
