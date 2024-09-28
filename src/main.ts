/**
 * This project is part of Non-Violable Liberty Layers (NVLL).
 * Free software under the terms of the CC BY-NC-SA 4.0 License.
 * You should have received a copy of the license along with NVLL.
 * If not, see <https://creativecommons.org/licenses/by-nc-sa/4.0>.
 */

/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import '$std/dotenv/load.ts'

import manifest from './fresh.gen.ts'
import config from './fresh.config.ts'

import { start } from '$fresh/server.ts'

await start(manifest, config)
