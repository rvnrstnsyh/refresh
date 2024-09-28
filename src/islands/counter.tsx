import type { Signal } from '@preact/signals'

import { JSX } from 'preact/jsx-runtime'
import { Button } from '../oceans/button.tsx'

interface CounterProps {
	count: Signal<number>
}

export default function Counter(props: CounterProps): JSX.Element {
	return (
		<div class='flex gap-8 py-6'>
			<Button onClick={() => props.count.value -= 3}>-3</Button>
			<Button onClick={() => props.count.value -= 2}>-2</Button>
			<Button onClick={() => props.count.value -= 1}>-1</Button>
			<p class='text-3xl tabular-nums'>{props.count}</p>
			<Button onClick={() => props.count.value += 1}>+1</Button>
			<Button onClick={() => props.count.value += 2}>+2</Button>
			<Button onClick={() => props.count.value += 3}>+3</Button>
		</div>
	)
}
