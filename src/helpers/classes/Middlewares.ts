import Kv from '../../helpers/classes/Kv.ts'
import Http from '../../helpers/classes/Http.ts'

import { loadSync } from '$std/dotenv/mod.ts'
import { sentinel } from '../functions/sentinel.ts'
import { uuidv7 } from '../../helpers/functions/ids.ts'

export default class Middlewares {
	private static readonly env: Record<string, string> = loadSync({ envPath: '.env', export: true })
	private static readonly protectedMethods: ReadonlySet<string> = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])
	private static readonly openMethods: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'])

	/**
	 * @description Asynchronously handles a route request.
	 * @param {MiddlewareRouteProps} request - The request object containing the request, context, URL, remote IP, and start time.
	 * @return {Promise<Response>} A promise that resolves to a Response object.
	 */
	public static async route({ request, ctx, url, remoteIp, startTime }: MiddlewareRouteProps): Promise<Response> {
		const method: string = request.method
		const trafficJam: boolean = this.protectedMethods.has(method) || !this.openMethods.has(method)

		let serverData: ServerDataSchema | undefined

		if (trafficJam) {
			const trafficKey: Deno.KvKey = [this.env['APP_NAME'] as string, 'traffics', remoteIp]
			const traffic: Deno.KvEntry<ServerDataSchema> = await Kv.get(trafficKey) as Deno.KvEntry<ServerDataSchema>
			const trafficHistories: TrafficSchema[] = traffic.value?.data?.histories as TrafficSchema[] || []
			const existingTraffic: TrafficSchema | undefined = trafficHistories.find((history: TrafficSchema): boolean => {
				const endpointMatch: boolean = history.endpoint === ctx.url.pathname
				const methodMatch: boolean = history.method === method
				const stillProcessing: boolean = history.processing
				const unsolved: boolean = history.status !== 'solved'
				return endpointMatch && methodMatch && (stillProcessing || unsolved)
			})

			if (existingTraffic) {
				const responseTime: string = `${(performance.now() - startTime).toFixed(2)}ms`
				const { headers, rateLimited }: SentinelData = sentinel(url.pathname, new Headers(), remoteIp, method, 102, responseTime)

				if (rateLimited) return new Response(null, { status: 429, headers })

				headers.set('location', '/api/v0/traffic-jam')

				return new Response(null, { status: 303, headers })
			} else {
				// add new traffic.
				const newTraffic: TrafficSchema = {
					request: uuidv7(),
					purpose: 'unclear',
					status: 'pending',
					remoteIp,
					endpoint: ctx.url.pathname,
					method,
					processing: true,
					timestamp: Math.trunc(Date.now() / 1000),
				}

				serverData = Http.data({
					success: true,
					code: 102,
					type: 'request',
					message: '+OK active traffic jam found',
					data: { histories: [...trafficHistories, newTraffic] },
				})

				await Kv.set(trafficKey, serverData)
			}
		}

		let response: Response

		try {
			response = await ctx.next()
		} catch (error) {
			response = new Response(`-ERR internal server error: ${error instanceof Error ? error.message : 'unknown error'}`, { status: 500 })
		}

		if (trafficJam && serverData) {
			const trafficKey: Deno.KvKey = [this.env['APP_NAME'] as string, 'traffics', remoteIp]
			const traffic: Deno.KvEntry<ServerDataSchema> = await Kv.get(trafficKey) as Deno.KvEntry<ServerDataSchema>
			const trafficHistories: TrafficSchema[] = traffic.value?.data?.histories as TrafficSchema[] || []
			const serverDataHistories: TrafficSchema[] = serverData?.data?.histories as TrafficSchema[] || []

			if (trafficHistories.length > 0 && serverDataHistories.length > 0) {
				const lastAddedRequest: string = serverDataHistories[serverDataHistories.length - 1].request
				const currentRequestIndex: number = trafficHistories.findIndex((history: TrafficSchema): boolean => history.request === lastAddedRequest)

				if (currentRequestIndex !== -1) {
					trafficHistories[currentRequestIndex] = {
						...trafficHistories[currentRequestIndex],
						purpose: response.headers.get('X-Purpose') || 'unclear',
						status: 'solved',
						processing: false,
					}

					const hasActiveTrafficJams: boolean = trafficHistories.some((history: TrafficSchema): boolean => history.processing)
					const updatedTrafficValue: ServerDataSchema = {
						...traffic.value,
						success: !hasActiveTrafficJams,
						code: hasActiveTrafficJams ? 102 : 200,
						message: hasActiveTrafficJams ? '+OK active traffic jam found' : '+OK no active traffic jam found',
						data: { histories: trafficHistories },
					}

					await Kv.set(trafficKey, updatedTrafficValue, 60 * 60 * 1000 * 24) // expire in 24 hours
				}
			}
		}

		const responseTime: string = `${(performance.now() - startTime).toFixed(2)}ms`
		const { headers, rateLimited }: SentinelData = sentinel(url.pathname, response.headers, remoteIp, method, response.status, responseTime)

		if (rateLimited) return new Response(null, { status: 429, headers })

		headers.set('X-Response-Time', responseTime)

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		})
	}

	/**
	 * @description Handles WebSocket requests and upgrades the request to a WebSocket connection.
	 * @param {Request} request - The incoming WebSocket request.
	 * @returns {Response} A Response object representing the upgraded WebSocket connection.
	 */
	public static socket(request: Request): Response {
		try {
			const { socket, response }: { socket: WebSocket; response: Response } = Deno.upgradeWebSocket(request)

			socket.onopen = () => {
				socket.send(JSON.stringify({ connection: '+OK ws established', status: true }))
			}
			socket.onmessage = (event: MessageEvent<string>): void => {
				// Handle incoming messages.
				console.log(JSON.parse(event.data))
			}
			socket.onclose = (_event: Event): void => {
				// Handle connection close.
			}
			socket.onerror = (event: Event): void => console.error('+ERR ws error:', event)

			return response
		} catch (error) {
			return new Response(`-ERR ws upgrade failed: ${error.message}`, { status: 400 })
		}
	}

	/**
	 * @description Handles requests to worker scripts and returns a response with the appropriate security headers and content type.
	 * @param {MiddlewareStaticProps} props - The props object containing the response, pathname, remote IP, method, and start time.
	 * @returns {Response} A Response object with the appropriate security headers and content type.
	 */
	public static worker({ response, pathname, remoteIp, method, startTime }: MiddlewareStaticProps): Response {
		const headers: Headers = new Headers(response.headers)
		const responseTime: string = `${(performance.now() - startTime).toFixed(2)}ms`
		const { headers: securedHeaders, rateLimited }: SentinelData = sentinel(
			pathname,
			headers,
			remoteIp,
			method,
			response.status,
			responseTime,
		)

		if (rateLimited) return new Response(null, { status: 429, headers: securedHeaders })

		securedHeaders.set('Content-Type', 'application/javascript')
		securedHeaders.set('X-Response-Time', responseTime)

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: securedHeaders,
		})
	}

	/**
	 * @description Handles static text file requests and applies security headers.
	 * @param {MiddlewareStaticProps} props - The props object containing the response, pathname, remote IP, method, and start time.
	 * @returns {Response} A Response object with the appropriate security headers and status code.
	 */
	public static text({ response, pathname, remoteIp, method, startTime }: MiddlewareStaticProps): Response {
		const headers: Headers = new Headers(response.headers)
		const responseTime: string = `${(performance.now() - startTime).toFixed(2)}ms`
		const { headers: securedHeaders, rateLimited }: SentinelData = sentinel(
			pathname,
			headers,
			remoteIp,
			method,
			response.status,
			responseTime,
		)

		if (rateLimited) return new Response(null, { status: 429, headers: securedHeaders })

		securedHeaders.set('Content-Type', 'text/plain; charset=utf-8')
		securedHeaders.set('X-Response-Time', responseTime)

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: securedHeaders,
		})
	}
}
