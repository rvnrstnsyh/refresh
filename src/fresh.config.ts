import tailwind from '$fresh/plugins/tailwind.ts'

import { load } from '$std/dotenv/mod.ts'
import { defineConfig } from '$fresh/server.ts'
import { AppContext } from './routes/_middleware.ts'

const env: Record<string, string> = await load({ envPath: '.env', export: true })

await AppContext.initialize('0000256F-1EAA-7FFF-1FFF-FFFFFFFFFFFF', env['APP_ENV'] as string)

export default defineConfig({
	server: {
		/** A literal IP address or host name that can be resolved to an IP address.
		 *
		 * __Note about `0.0.0.0`__ While listening `0.0.0.0` works on all platforms,
		 * the browsers on Windows don't work with the address `0.0.0.0`.
		 * You should show the message like `server running on localhost:8080` instead of
		 * `server running on 0.0.0.0:8080` if your program supports Windows.
		 *
		 * @default {"0.0.0.0"} */
		hostname: env['APP_HOSTNAME'] as string || '0.0.0.0',
		/** The port to listen on.
		 *
		 * @default {8000} */
		port: parseInt(env['APP_PORT'] as string) || 3000,
	},
	router: {
		/**
		 *  Controls whether Fresh will append a trailing slash to the URL.
		 *  @default {false}
		 */
		trailingSlash: false,
		/**
		 * Serve fresh from a base path instead of from the root.
		 *   "/foo/bar" -> http://localhost:8000/foo/bar
		 * @default {undefined}
		 */
		basePath: undefined,
	},
	plugins: [
		tailwind(),
	],
})
