import { drizzle } from '@drodrigues4/drizzle-orm/singlestore';

import mysql from 'mysql2/promise';
import * as schema from './test1/schema';

export async function connect(database: string | undefined = undefined): Promise<[mysql.Connection, ReturnType<typeof drizzle>]> {
    if (!process.env.UNITTEST_PORT) {
        throw new Error('UNITTEST_PORT is not defined');
    }

    var connection

    if (!database) {
        connection = await mysql.createConnection({
            host: process.env.UNITTEST_HOST,
            port: parseInt(process.env.UNITTEST_PORT),
            user: process.env.UNITTEST_USER,
            password: process.env.UNITTEST_PASSWORD,
            multipleStatements: false,
        });
    } else {
        connection = await mysql.createConnection({
            host: process.env.UNITTEST_HOST,
            port: parseInt(process.env.UNITTEST_PORT),
            user: process.env.UNITTEST_USER,
            password: process.env.UNITTEST_PASSWORD,
            database: database,
            multipleStatements: false,
        });
    }
    
    const db = drizzle(connection, { schema, mode: "default"})
    
    return [connection, db];
}
