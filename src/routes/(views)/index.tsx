import Counter from '../../islands/counter.tsx'

import { JSX } from 'preact/jsx-runtime'
import { load } from '$std/dotenv/mod.ts'
import { asset } from '$fresh/src/runtime/utils.ts'
import { Signal, useSignal } from '@preact/signals'

const env: Record<string, string> = await load({ envPath: '.env', export: true })

export default function Home(): JSX.Element {
	const count: Signal<number> = useSignal(0)

	return (
		<div class='px-4 py-8 mx-auto'>
			<div class='max-w-screen-md mx-auto flex flex-col items-center justify-center'>
				<img class='my-6' src={asset('/assets/svg/check.svg')} alt={`${env['APP_NAME'] as string} logo`} />
				<h1 class='text-4xl font-bold'>{env['APP_NAME'] as string} &copy; {new Date().getFullYear()} Non-Violable Liberty Layers</h1>
				<p class='my-4'>
					Try updating this message in the
					<code class='mx-2 bg-gray'>./src/routes/(views)/index.tsx</code> file, and refresh.
				</p>
				<Counter count={count} />
			</div>
		</div>
	)
}
