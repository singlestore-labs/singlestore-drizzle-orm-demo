import { bigint, mysqlTable, varchar } from '@drodrigues4/drizzle-orm/mysql-core';
import { customBson, customBlob } from '../../src/custom-types';

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 256 }),
  age: bigint('age', { mode: 'number' }),
  bsonCol: customBson('bson_column'),
  blobCol: customBlob('blob_column'),
});

export type User = typeof users.$inferSelect; // return type when queried
export type NewUser = typeof users.$inferInsert; // insert type
