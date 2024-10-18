import { Client } from 'mysql'

export const sql: Client = await new Client().connect({
	hostname: '127.0.0.1',
	port: 3306,
	username: 'root',
	password: '',
	db: 'nvll',
	poolSize: 0, // connection limit is 3.
	timeout: 1000 * 30, // set timeout to 30 seconds
})
