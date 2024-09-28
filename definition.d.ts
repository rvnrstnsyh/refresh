import { FreshContext } from '$fresh/server.ts'
import { AppContext } from './src/routes/_middleware.ts'

declare global {
	interface SystemState {
		context: AppContext
	}

	interface SentinelData {
		headers: Headers
		rateLimited: boolean
	}

	interface MiddlewareStaticProps {
		response: Response
		pathname: string
		remoteIp: string
		method: string
		startTime: number
	}

	interface MiddlewareRouteProps {
		request: Request
		ctx: FreshContext<SystemState>
		url: URL
		remoteIp: string
		startTime: number
	}

	interface HttpPayload {
		[key: string]: unknown
	}

	type Schemas = ServerDataSchema | SystemSchema | TrafficSchema

	interface ServerDataSchema {
		success: boolean
		code: number
		type: string
		message: string
		data?: Record<string, unknown>
		errors?: {
			[key: string]: {
				issue: string
				value: unknown
			}
		}
		feedback?: string
	}

	interface AfterServerDataSchema {
		success: boolean
		code: number
		type?: string
		message?: string
		data?: Record<string, unknown>
		errors?: {
			[key: string]: {
				issue: string
				value: unknown
			}
		}
		feedback?: string
	}

	interface SystemSchema {
		ulid: string
		keys: {
			hmac: string
			schnorr: string
		}
	}

	interface TrafficSchema {
		request: string
		purpose: string
		status: string
		remoteIp: string
		endpoint: string
		method: string
		processing: boolean
		timestamp: number
	}
}
