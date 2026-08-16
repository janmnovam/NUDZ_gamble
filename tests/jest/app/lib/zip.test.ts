import { createZip, crc32 } from '@/app/lib/zip.ts'

const encoder = new TextEncoder()

describe('crc32', () => {
  it('matches the standard CRC-32 test vector for "123456789"', () => {
    expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926)
  })

  it('is 0 for an empty buffer', () => {
    expect(crc32(new Uint8Array(0))).toBe(0)
  })
})

describe('createZip', () => {
  it('writes local file headers, a central directory, and an end-of-central-directory record for every entry', () => {
    const zip = createZip([
      { name: 'a.csv', data: encoder.encode('a,b\r\n1,2\r\n') },
      { name: 'b.csv', data: encoder.encode('') },
    ])
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)

    // Two local file headers (PK\x03\x04), in order, each carrying its own entry name.
    expect(view.getUint32(0, true)).toBe(0x04034b50)
    const firstNameLen = view.getUint16(26, true)
    const firstName = new TextDecoder().decode(zip.subarray(30, 30 + firstNameLen))
    expect(firstName).toBe('a.csv')

    // Exactly one end-of-central-directory record, at the very end of the archive.
    const eocdOffset = zip.length - 22
    expect(view.getUint32(eocdOffset, true)).toBe(0x06054b50)
    expect(view.getUint16(eocdOffset + 10, true)).toBe(2) // total entries

    const centralDirOffset = view.getUint32(eocdOffset + 16, true)
    expect(view.getUint32(centralDirOffset, true)).toBe(0x02014b50) // PK\x01\x02
  })

  it('stores entry bytes uncompressed, byte-for-byte recoverable from the local header', () => {
    const zip = createZip([{ name: 'only.csv', data: encoder.encode('x,y\r\n1,2\r\n') }])
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
    const nameLen = view.getUint16(26, true)
    const storedSize = view.getUint32(18, true)
    const dataStart = 30 + nameLen
    expect(new TextDecoder().decode(zip.subarray(dataStart, dataStart + storedSize))).toBe(
      'x,y\r\n1,2\r\n',
    )
  })
})
