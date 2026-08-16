/**
 * Minimal ZIP writer — "store" method only (entries are copied
 * uncompressed). Enough to bundle a handful of small CSV files for the
 * export button without pulling in a compression dependency; every unzip
 * tool opens a stored-only archive exactly like a compressed one.
 */

export interface ZipEntry {
  name: string
  data: Uint8Array
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

/** Standard ZIP checksum (reflected CRC-32, polynomial 0xEDB88320). */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f)
  const dosDate =
    (((date.getFullYear() - 1980) & 0x7f) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, date: dosDate }
}

/** Builds a `PK\x03\x04` local file header + its raw (uncompressed) bytes. */
function localFileRecord(
  entry: ZipEntry,
  nameBytes: Uint8Array,
  crc: number,
  dosTime: number,
  dosDate: number,
): Uint8Array {
  const header = new Uint8Array(30 + nameBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x04034b50, true)
  view.setUint16(4, 20, true) // version needed to extract
  view.setUint16(6, 0, true) // general purpose flags
  view.setUint16(8, 0, true) // compression method: store
  view.setUint16(10, dosTime, true)
  view.setUint16(12, dosDate, true)
  view.setUint32(14, crc, true)
  view.setUint32(18, entry.data.length, true) // compressed size
  view.setUint32(22, entry.data.length, true) // uncompressed size
  view.setUint16(26, nameBytes.length, true)
  view.setUint16(28, 0, true) // extra field length
  header.set(nameBytes, 30)

  const record = new Uint8Array(header.length + entry.data.length)
  record.set(header, 0)
  record.set(entry.data, header.length)
  return record
}

/** Builds a `PK\x01\x02` central directory header for one entry. */
function centralDirectoryRecord(
  nameBytes: Uint8Array,
  crc: number,
  size: number,
  dosTime: number,
  dosDate: number,
  localHeaderOffset: number,
): Uint8Array {
  const record = new Uint8Array(46 + nameBytes.length)
  const view = new DataView(record.buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint16(4, 20, true) // version made by
  view.setUint16(6, 20, true) // version needed to extract
  view.setUint16(8, 0, true) // general purpose flags
  view.setUint16(10, 0, true) // compression method: store
  view.setUint16(12, dosTime, true)
  view.setUint16(14, dosDate, true)
  view.setUint32(16, crc, true)
  view.setUint32(20, size, true) // compressed size
  view.setUint32(24, size, true) // uncompressed size
  view.setUint16(28, nameBytes.length, true)
  view.setUint16(30, 0, true) // extra field length
  view.setUint16(32, 0, true) // file comment length
  view.setUint16(34, 0, true) // disk number start
  view.setUint16(36, 0, true) // internal file attributes
  view.setUint32(38, 0, true) // external file attributes
  view.setUint32(42, localHeaderOffset, true)
  record.set(nameBytes, 46)
  return record
}

/** Concatenates the local file records, central directory, and end-of-central-directory record into one ZIP archive. */
export function createZip(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder()
  const { time: dosTime, date: dosDate } = dosDateTime(new Date())

  const localRecords: Uint8Array[] = []
  const centralRecords: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)

    const local = localFileRecord(entry, nameBytes, crc, dosTime, dosDate)
    localRecords.push(local)
    centralRecords.push(
      centralDirectoryRecord(nameBytes, crc, entry.data.length, dosTime, dosDate, offset),
    )
    offset += local.length
  }

  const centralDirOffset = offset
  const centralDirSize = centralRecords.reduce((sum, r) => sum + r.length, 0)

  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true) // disk number
  endView.setUint16(6, 0, true) // disk with central directory start
  endView.setUint16(8, entries.length, true) // records on this disk
  endView.setUint16(10, entries.length, true) // total records
  endView.setUint32(12, centralDirSize, true)
  endView.setUint32(16, centralDirOffset, true)
  endView.setUint16(20, 0, true) // comment length

  const zip = new Uint8Array(centralDirOffset + centralDirSize + end.length)
  let pos = 0
  for (const record of [...localRecords, ...centralRecords, end]) {
    zip.set(record, pos)
    pos += record.length
  }
  return zip
}
