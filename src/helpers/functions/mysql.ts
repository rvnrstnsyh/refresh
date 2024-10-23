import { Client } from 'mysql'
import { load } from '$std/dotenv/mod.ts'

const env: Record<string, string> = await load({ envPath: '.env', export: true })

export default async function connect(): Promise<Client> {
	const sql: Client = await new Client().connect({
		hostname: env['SQL_HOSTNAME'] as string,
		port: Number(env['SQL_PORT'] as unknown),
		username: env['SQL_USERNAME'] as string,
		password: env['SQL_PASSWORD'] as string,
		db: env['SQL_DATABASE'] as string,
		poolSize: Number(env['SQL_POOLSIZE'] as unknown), // connection limit is 3.
		timeout: Number(env['SQL_TIMEOUT'] as unknown), // set timeout to 30 seconds.
	})
	return sql
}
