import { JSX } from 'preact/jsx-runtime'
import { PageProps } from '$fresh/server.ts'

export default function Greet(props: PageProps): JSX.Element {
	return <pre class='pl-2 pt-[11px] text-[13px]'>Hello {props.params.name}</pre>
}
