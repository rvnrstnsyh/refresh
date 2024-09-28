import { JSX } from 'preact/jsx-runtime'
import { IS_BROWSER } from '$fresh/runtime.ts'

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>): JSX.Element {
	return <button {...props} disabled={!IS_BROWSER || props.disabled} class='px-2 py-1' />
}
