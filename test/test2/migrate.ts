// Run
// npx tsx test/test2/migrate.ts 
// to apply the migrations to the database.
// You should not need to run this, since the tests should always run the migrations before running the tests.

import 'dotenv/config';
import { migrate } from '@drodrigues4/drizzle-orm/singlestore/migrator';
import { connect } from '../db';

const [connection, db] = await connect("test2");

// This will run migrations on the database, skipping the ones already applied
await migrate(db, { migrationsFolder: 'test/test2/migrations' });

// Don't forget to close the connection, otherwise the script will hang
await connection.end();
