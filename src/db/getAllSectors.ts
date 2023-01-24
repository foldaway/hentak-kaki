import { DynamoDB } from 'aws-sdk';

import { TableNameSector } from './tableNames';

const db = new DynamoDB.DocumentClient();

export async function getAllSectors(): Promise<DB.Sector[]> {
  const sectors: DB.Sector[] = [];

  let ExclusiveStartKey: any = undefined;

  do {
    const query = await db
      .scan({
        TableName: TableNameSector,
        ExclusiveStartKey,
      })
      .promise();

    ExclusiveStartKey = query.LastEvaluatedKey;

    sectors.push(...(query.Items as DB.Sector[]));
  } while (ExclusiveStartKey != null);

  return sectors;
}
