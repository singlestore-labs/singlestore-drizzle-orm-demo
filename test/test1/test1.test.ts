import { expect, test, describe } from 'vitest'

import { connect } from '../db';
import { users, messages } from './schema';
import { migrate } from '@drodrigues4/drizzle-orm/singlestore/migrator';

import { eq } from 'drizzle-orm';

const [connectionNoDatabase] = await connect();

await connectionNoDatabase.query('DROP DATABASE IF EXISTS test1');
await connectionNoDatabase.query('CREATE DATABASE test1');

const [, db] = await connect("test1");

await migrate(db, { migrationsFolder: 'test/test1/migrations' });

describe('users', () => {
	test('should insert a user', async () => {
		const result = await db.insert(users).values({ fullName: 'Morty' });
		expect(result).toEqual([
			{
				fieldCount: 0,
				affectedRows: 1,
				serverStatus: 2,
				warningStatus: 0,
				changedRows: 0,
				info: '',
				insertId: result[0].insertId
			},
			undefined
		]);
	});

	test('should get users', async () => {
		const [result] = await db.select().from(users);
		expect(result.fullName).toEqual("Morty")
	});
});

describe('messages', async () => {
	test('should insert a message', async () => {
		const usersResult = await db.select().from(users);
		const user = usersResult[0];

		const messagesResult = await db.insert(messages).values({
			userId: user.id,
			message: 'Hello',
			createdAt: new Date()
		});
		expect(messagesResult).toEqual([
			{
				fieldCount: 0,
				affectedRows: 1,
				serverStatus: 2,
				warningStatus: 0,
				changedRows: 0,
				info: '',
				insertId: messagesResult[0].insertId
			},
			undefined
		]);
	});

	test('should join with users', async () => {		
		const usersResult = await db.select().from(users);
		const user = usersResult[0];

		const messagesResult = await db.select().from(messages);
		const message = messagesResult[0];

		const joinResult = await db.select().from(messages).innerJoin(users, eq(messages.userId, users.id));
		expect(joinResult).toEqual([
			{
				messages: {
					id: message.id,
					userId: message.userId,
					message: 'Hello',
					createdAt: message.createdAt,
				},
				users: {
					id: user.id,
					fullName: 'Morty',
					extID: user.extID
				},
			}
		]);

		const fullJoinResult = await db.select().from(messages).fullJoin(users, eq(messages.userId, users.id));
		expect(fullJoinResult).toEqual([
			{
				messages: {
					id: message.id,
					userId: message.userId,
					message: 'Hello',
					createdAt: message.createdAt,
				},
				users: {
					id: user.id,
					fullName: 'Morty',
					extID: user.extID
				},
			}
		]);
	});
});
