import Kv from '../../../../helpers/classes/Kv.ts'

import { load } from '$std/dotenv/mod.ts'
import { FreshContext, Handlers } from '$fresh/server.ts'

const env: Record<string, string> = await load({ envPath: '.env', export: true })

export const handler: Handlers<AfterServerDataSchema> = {
	/**
	 * @description Asynchronously handles a GET request to retrieve traffic jam data.
	 * @param {Request} request - the incoming request object
	 * @param {FreshContext} ctx - the fresh context object
	 * @return {Promise<Response>} a promise that resolves to a Response object containing the traffic jam data
	 */
	async GET(request: Request, ctx: FreshContext): Promise<Response> {
		const url: URL = new URL(request.url)
		const remoteIpQuery: string = url.searchParams.get('remoteIp') as string
		const activeQuery: boolean = url.searchParams.get('active') === 'true'
		const historyQuery: boolean = url.searchParams.get('history') === 'true'
		const remoteIp: string = remoteIpQuery || request.headers.get('X-Forwarded-For') || ctx.remoteAddr.hostname
		const trafficKey: Deno.KvKey = [env['APP_NAME'] as string, 'traffics', remoteIp]
		const traffic: Deno.KvEntry<AfterServerDataSchema> = await Kv.get(trafficKey) as Deno.KvEntry<AfterServerDataSchema>
		const serverData: AfterServerDataSchema = {
			success: true,
			code: 200,
			type: 'request',
			message: '+OK no active traffic jam found',
			data: {
				actives: [],
				histories: [],
			},
		}

		if (traffic && traffic.value && traffic.value.data?.histories) {
			const trafficHistories: TrafficSchema[] = traffic.value.data.histories as TrafficSchema[]
			if (activeQuery && historyQuery) {
				Object.assign(serverData, {
					data: {
						actives: trafficHistories.filter((history: TrafficSchema) => history.processing),
						histories: trafficHistories.filter((history: TrafficSchema) => !history.processing),
					},
				})
			} else if (activeQuery) {
				Object.assign(serverData, { data: { actives: trafficHistories.filter((history: TrafficSchema) => history.processing) } })
			} else if (historyQuery) {
				Object.assign(serverData, { data: { histories: trafficHistories.filter((history: TrafficSchema) => !history.processing) } })
			} else {
				Object.assign(serverData, { data: { actives: trafficHistories.filter((history: TrafficSchema) => history.processing) } })
			}
		}

		return Response.json(serverData)
	},
}
