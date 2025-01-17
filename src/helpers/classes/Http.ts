import { z } from 'zod'
import { FreshContext } from '$fresh/server.ts'
import { Cookie, setCookie } from '$std/http/cookie.ts'

export default class Http {
	/**
	 * @description Extracts the payload from the request based on the content type.
	 * @param {Request} request - The incoming request object.
	 * @param {FreshContext} ctx - The fresh context object.
	 * @param {readonly string[]} supportedContentTypes - The list of supported content types.
	 * @returns {Promise<HttpPayload>} A Promise that resolves to the extracted payload, or an empty object if the content type is not supported.
	 */
	public static async payloadExtractor(request: Request, ctx: FreshContext, supportedContentTypes: readonly string[]): Promise<HttpPayload> {
		switch (request.headers.get('Content-Type') as typeof supportedContentTypes[number] | null) {
			case 'application/x-www-form-urlencoded': {
				try {
					const formData: FormData = await request.formData()
					const payload: Record<string, unknown> = Object.fromEntries(formData.entries())
					return {
						remoteIp: request.headers.get('X-Forwarded-For') || ctx.remoteAddr.hostname,
						...payload,
					}
				} catch (_error) {
					return {}
				}
			}
			case 'application/json': {
				try {
					return {
						remoteIp: request.headers.get('X-Forwarded-For') || ctx.remoteAddr.hostname,
						...await request.json() as HttpPayload,
					}
				} catch (_error) {
					return {}
				}
			}
			default: {
				return {}
			}
		}
	}

	/**
	 * @description Wraps the provided data into a ServerDataSchema object.
	 * @param {Partial<ServerDataSchema>} params - The data to be wrapped.
	 * @return {ServerDataSchema} A ServerDataSchema object with the provided data and default values for missing properties.
	 */
	public static data(params: Partial<ServerDataSchema>): ServerDataSchema {
		const data: ServerDataSchema = {
			success: params.success ?? false,
			code: params.code ?? 500,
			type: params.type ?? 'request',
			message: params.message ?? '',
			data: params.data,
			errors: params.errors,
			feedback: params.feedback,
		}
		return data
	}

	/**
	 * @description Sends a server data response as a JSON object.
	 * @param {ServerDataSchema} data - The server data to send as a response.
	 * @returns {Response} The response object.
	 */
	public static json(data: ServerDataSchema): Response {
		return Response.json(data, { status: data.code })
	}

	/**
	 * @description Validates the payload against the provided schema and returns a strongly typed ServerDataSchema object.
	 * @param {T} schema - The Zod schema to validate against.
	 * @param {HttpPayload} payload - The data to be validated.
	 * @returns {ServerDataSchema} - A strongly typed ServerDataSchema object with the validation result.
	 */
	public static validator<T extends z.ZodTypeAny>(schema: T, payload: HttpPayload): ServerDataSchema {
		const result: z.SafeParseReturnType<T, HttpPayload> = schema.safeParse(payload)
		if (result.success) {
			return this.data({
				success: true,
				code: 200,
				type: 'request',
				message: '+OK all fields are valid',
				data: { ...payload, ...result.data },
			})
		} else {
			const errors: ServerDataSchema['errors'] = result.error.issues.reduce<ServerDataSchema['errors']>((acc, issue) => {
				const fieldKey: string = issue.path.join('.')
				return {
					...acc,
					[fieldKey]: {
						issue: issue.message.toLowerCase(),
						value: payload[fieldKey],
					},
				}
			}, {})

			return this.data({
				success: false,
				code: 400,
				type: 'error',
				message: '-ERR validation failed',
				errors,
			})
		}
	}

	/**
	 * @description Sends a response based on the provided content type and server data.
	 * @param {string} contentType - The content type of the response.
	 * @param {ServerDataSchema} data - The server data to be sent in the response.
	 * @param {string} [pathname='/'] - The pathname of the response. Defaults to '/'.
	 * @return {Response} A Response object with the appropriate data and status code.
	 */
	public static responder(contentType: string, data: ServerDataSchema, pathname: string = '/'): Response {
		const headers: Headers = new Headers()
		const responseData: ServerDataSchema = { ...data }

		if (data.success && data.data) responseData.data = data.data
		if (!data.success && data.errors) responseData.errors = data.errors
		if (data.feedback) responseData.feedback = data.feedback
		if (data.success && data.data?.session) {
			setCookie(headers, {
				name: 'session',
				value: data.data.session as string,
				path: pathname,
				sameSite: 'Strict' as Cookie['sameSite'],
				secure: true,
				httpOnly: true,
				maxAge: 60 * 60 * 1000 * 24, // 24 hour in this case.
			})
			delete data.data.session
		}
		if (contentType.includes('application/x-www-form-urlencoded')) {
			setCookie(headers, {
				name: 'data',
				value: encodeURIComponent(JSON.stringify(responseData)),
				path: pathname,
				sameSite: 'Strict' as Cookie['sameSite'],
				secure: true,
				httpOnly: true,
				maxAge: 60,
			})
			headers.set('Location', pathname)
			headers.set('X-Purpose', data.type || 'unclear')
			return new Response(null, { status: 303, headers })
		}

		return Response.json(responseData, { status: data.code, headers })
	}
}
