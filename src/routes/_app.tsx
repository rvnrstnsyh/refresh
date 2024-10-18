import type { PageProps } from '$fresh/server.ts'

import { load } from '$std/dotenv/mod.ts'
import { JSX } from 'preact/jsx-runtime'

const env: Record<string, string> = await load({ envPath: '.env', export: true })

export default function App({ Component }: PageProps): JSX.Element {
	const css: JSX.HTMLAttributes<HTMLLinkElement>[] = [
		{
			rel: 'stylesheet',
			type: 'text/css',
			href: '/index.css',
		},
		{
			type: 'text/css',
			rel: 'stylesheet',
			href: 'https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.5.1/flowbite.min.css',
			integrity: 'sha512-NSQvA9LCLGdogRtETRB+M8stg/Q+sJBHUjMEESzGzYpW6Gb8lVsMMmIOKszGwiQlaOeavZsKGRxeVr/b7AYSGA==',
			crossorigin: 'anonymous',
			referrerpolicy: 'no-referrer',
		},
		{
			type: 'text/css',
			rel: 'stylesheet',
			href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css',
			integrity: 'sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg==',
			crossorigin: 'anonymous',
			referrerpolicy: 'no-referrer',
		},
	]
	const script: JSX.HTMLAttributes<HTMLScriptElement>[] = [
		{
			type: 'text/javascript',
			src: 'https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.5.1/flowbite.min.js',
			integrity: 'sha512-3OhI+rK9DaQNau/o2HdRre6v1c/6EwMdY965UnYJevchxvO7mVYmp2wz39Igla9aLjpoFr+9IU4NkAeHGg74/A==',
			crossorigin: 'anonymous',
			referrerpolicy: 'no-referrer',
		},
	]

	return (
		// <!DOCTYPE html>
		<html lang='en'>
			<head>
				<meta charset='UTF-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
				<title>Non-Violable Liberty Layers | {env['APP_NAME'] as string}</title>
				<meta name='description' content={`Non-Violable Liberty Layers | ${env['APP_NAME'] as string}`} />
				{css.reverse().map((link) => <link {...link} />)}
			</head>
			<body>
				<Component />
				{script.reverse().map((link) => <script {...link} />)}
			</body>
		</html>
	)
}
