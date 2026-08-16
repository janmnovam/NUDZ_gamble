import { TextDecoder, TextEncoder } from 'node:util'
import { deserialize, serialize } from 'node:v8'

import 'fake-indexeddb/auto'

// jest's jsdom environment omits structuredClone, which fake-indexeddb needs
// on every write. Back it with v8 structured serialize/deserialize.
type Cloner = <T>(value: T) => T
const withClone = globalThis as unknown as { structuredClone?: Cloner }
withClone.structuredClone ??= (value) => deserialize(serialize(value)) as typeof value

// jest's jsdom environment also omits TextEncoder/TextDecoder, which the ZIP
// export path (src/app/lib/zip.ts) needs to turn CSV strings into bytes.
const withText = globalThis as unknown as {
  TextEncoder?: typeof TextEncoder
  TextDecoder?: typeof TextDecoder
}
withText.TextEncoder ??= TextEncoder
withText.TextDecoder ??= TextDecoder
