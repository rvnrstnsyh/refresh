import { monotonicFactory, ULID } from 'ulid'
import { Generator, generator, GeneratorOptions, timestamp } from 'ui7'

export const ulid: ULID = monotonicFactory()

export const uuidv7: Generator = generator({
	time: () => Math.trunc(Date.now() / 1000),
	entropy: 0xff,
	upper: true,
	dashes: true,
} as GeneratorOptions)

/**
 * @description Parses a UUIDv7 string and returns its timestamp component.
 * @param {string} uuidv7 - The UUIDv7 string to parse.
 * @return {number} The timestamp component of the UUIDv7 string.
 */
export function parse(uuidv7: string): number {
	return timestamp(uuidv7)
}
