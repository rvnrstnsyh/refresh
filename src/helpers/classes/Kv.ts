import { FreshContext } from '$fresh/server.ts'

export const kv: Deno.Kv = await Deno.openKv()

export default class Kv {
	/**
	 * @description Retrieves the system ID from the given FreshContext.
	 * @param {FreshContext} ctx - The FreshContext object.
	 * @return {string} The system ID.
	 */
	public static id(ctx: FreshContext): string {
		return (ctx.state.context as SystemState['context']).id
	}

	/**
	 * @description Asynchronously sets a value in the database using the specified key.
	 * @param {Deno.KvKey} key - The key used to set the value.
	 * @param {Schemas} value - The value to set.
	 * @param {number} [expireIn] - The optional expiration time in milliseconds.
	 * @return {Promise<Deno.KvCommitResult>} - A Promise that resolves to the result of the commit operation.
	 */
	public static async set(key: Deno.KvKey, value: Schemas, expireIn?: number): Promise<Deno.KvCommitResult> {
		return await kv.set(key, value, { expireIn })
	}

	/**
	 * @description Asynchronously retrieves a value from the database using the specified key.
	 * @param {Deno.KvKey} key - The key used to retrieve the value.
	 * @returns {Promise<Deno.KvEntryMaybe<Schemas>>} - A Promise that resolves to the value associated
	 * with the specified key, or undefined if the key does not exist.
	 */
	public static async get(key: Deno.KvKey): Promise<Deno.KvEntryMaybe<Schemas>> {
		return await kv.get<Schemas>(key)
	}

	/**
	 * @description Asynchronously retrieves multiple values from the database using the specified keys.
	 * @param {Deno.KvKey[]} key - An array of keys used to retrieve the values.
	 * @return {Promise<(Deno.KvEntryMaybe<unknown>)[]>} A Promise that resolves to an array of values associated with the specified keys,
	 * or undefined if any of the keys do not exist.
	 */
	public static async getMany(key: Deno.KvKey[]): Promise<(Deno.KvEntryMaybe<unknown>)[]> {
		return await kv.getMany(key)
	}

	/**
	 * @description Asynchronously lists all keys in the database with the specified prefix.
	 * @param {string[]} prefix - The prefix used to filter the keys.
	 * @returns {Deno.KvListIterator<string>} - A Promise that resolves to an iterator of strings,
	 * where each string is a key in the database that matches the specified prefix.
	 */
	public static list(prefix: string[]): Deno.KvListIterator<string> {
		return kv.list<string>({ prefix })
	}

	/**
	 * @description Asynchronously deletes a value from the database using the specified key.
	 * @param {Deno.KvKey} key - The key used to delete the value.
	 * @returns {Promise<void>} - A Promise that resolves once the deletion operation is complete.
	 */
	public static async del(key: Deno.KvKey): Promise<void> {
		return await kv.delete(key)
	}
}
