/**
 * Test-side readers for the export archive. The app builds a "store" (no
 * compression) ZIP by hand (`src/app/lib/zip.ts`), so a tiny local-file-header
 * walk is enough to extract the entries — no external `unzip` or zip dependency,
 * which keeps the test portable across machines and CI.
 */

const LOCAL_FILE_SIGNATURE = 0x0403_4b50

/** Extract a stored (uncompressed) ZIP into a map of entry name → text. */
export function readStoredZip(buffer: Buffer): Map<string, string> {
  const files = new Map<string, string>()
  let offset = 0

  while (offset + 4 <= buffer.length && buffer.readUInt32LE(offset) === LOCAL_FILE_SIGNATURE) {
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLength)
    const dataStart = offset + 30 + nameLength + extraLength
    const data = buffer.subarray(dataStart, dataStart + compressedSize)
    files.set(name, data.toString('utf8'))
    offset = dataStart + compressedSize
  }

  return files
}

export interface ParsedCsv {
  header: string[]
  rows: string[][]
  /** Look up a cell in a row by column name. */
  cell: (row: string[], column: string) => string
  /** The first row whose `column` equals `value`; throws if none matches. */
  row: (column: string, value: string) => string[]
}

/** Parse a CSV (RFC 4180 quoting, CRLF line endings, trailing newline). */
export function parseCsv(text: string): ParsedCsv {
  const lines = splitRecords(text)
  const header = lines.length > 0 ? splitFields(lines[0] ?? '') : []
  const rows = lines.slice(1).map(splitFields)
  const cell = (row: string[], column: string): string => {
    const index = header.indexOf(column)
    return index === -1 ? '' : (row[index] ?? '')
  }
  const row = (column: string, value: string): string[] => {
    const found = rows.find((r) => cell(r, column) === value)
    if (found === undefined) throw new Error(`no CSV row with ${column}=${value}`)
    return found
  }
  return { header, rows, cell, row }
}

/** Split into records on CRLF, honouring newlines inside quoted fields. */
function splitRecords(text: string): string[] {
  const records: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') inQuotes = !inQuotes
    if (!inQuotes && char === '\r' && text[i + 1] === '\n') {
      records.push(current)
      current = ''
      i += 1
      continue
    }
    current += char
  }
  if (current.length > 0) records.push(current)
  return records
}

function splitFields(record: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < record.length; i += 1) {
    const char = record[i]
    if (char === '"') {
      if (inQuotes && record[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
      continue
    }
    current += char
  }
  fields.push(current)
  return fields
}
