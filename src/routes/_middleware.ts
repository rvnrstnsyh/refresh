import connect from '../helpers/functions/mysql.ts'
import Middlewares from '../helpers/classes/Middlewares.ts'

import type { Client } from 'mysql'

import { load } from '$std/dotenv/mod.ts'
import { FreshContext } from '$fresh/server.ts'

const env: Record<string, string> = await load({ envPath: '.env', export: true })

export class AppContext {
	public readonly id: string
	public readonly env: string

	private static instance: AppContext
	private ready: boolean = false

	/**
	 * @description Presumably this involves connecting to a database or doing some heavy computation
	 * @param {string} id The system id.
	 * @param {string} env App environment.
	 */
	private constructor(id: string, env: string) {
		this.id = id
		this.env = env
	}

	/**
	 * @description Initializes the AppContext instance if it hasn't been already.
	 * @param {string} id The system id.
	 * @param {string} env App environment.
	 * @returns {Promise<AppContext>} A promise that resolves to the AppContext instance.
	 */
	public static async initialize(id: string, env: string): Promise<AppContext> {
		if (!AppContext.instance) {
			AppContext.instance = new AppContext(id, env)
			await AppContext.instance.setup()
		}
		return AppContext.instance
	}

	/**
	 * @description Returns the initialized AppContext instance.
	 * @throws {Error} If the AppContext instance is not initialized or not ready.
	 * @returns {AppContext} The initialized AppContext instance.
	 */
	public static newInstance(): AppContext {
		if (!AppContext.instance || !AppContext.instance.ready) throw new Error('-ERR app context is not initialized')
		return AppContext.instance
	}

	/**
	 * @description Initializes the AppContext instance.
	 * @throws {Error} If the initialization fails.
	 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
	 */
	private async setup(): Promise<void> {
		if (this.ready) return

		console.log(`System ${env['APP_NAME'] as string} initialization...`)
		try {
			const sql: Client = await connect()
			await sql.query('SELECT 100 + 100 AS OK')
			await sql.close()
			console.log('+OK database established')
			await new Promise((resolve) => setTimeout(resolve, 2000))
			console.clear()
			console.log('+OK system ready')
			this.ready = true
		} catch (error) {
			throw error instanceof Error ? error.message.toLowerCase() : String(error) // Re-throw to allow caller to handle initialization failure
		} finally {
			console.log('.')
		}
	}
}

/**
 * @description Handles incoming requests and returns a response.
 * @param {Request} request - The incoming request object.
 * @param {FreshContext<SystemState>} ctx - The context object containing system state.
 * @return {Promise<Response>} A promise that resolves to the response object.
 */
export async function handler(request: Request, ctx: FreshContext<SystemState>): Promise<Response> {
	try {
		ctx.state.context = AppContext.newInstance()

		const url: URL = new URL(request.url)
		const remoteIp: string = request.headers.get('X-Forwarded-For') || ctx.remoteAddr.hostname
		const startTime: number = performance.now()
		// Handle 404 Not Found
		if (ctx.destination === 'notFound') return new Response('-ERR 404 not found', { status: 404 })
		// Handle WebSockets
		if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') return Middlewares.socket(request)
		// Handle static files and workers
		if (ctx.destination === 'static') {
			const response: Response = await ctx.next()
			const workerPathname: boolean = url.pathname.startsWith('/workers/')
			const jsFile: boolean = url.pathname.endsWith('.js')
			const txtFile: boolean = url.pathname.endsWith('.txt')
			const staticProps: MiddlewareStaticProps = {
				response,
				pathname: url.pathname,
				remoteIp,
				method: request.method,
				startTime,
			}

			if (txtFile) return Middlewares.text(staticProps)
			if (workerPathname && jsFile) return Middlewares.worker(staticProps)

			return response
		}
		// Handle routes
		if (ctx.destination === 'route') return await Middlewares.route({ request, ctx, url, remoteIp, startTime } as MiddlewareRouteProps)
		// Default fallback
		return ctx.next()
	} catch (error) {
		return new Response(`-ERR internal server error: ${error instanceof Error ? error.message.toLowerCase() : String(error)}`, { status: 500 })
	}
}
