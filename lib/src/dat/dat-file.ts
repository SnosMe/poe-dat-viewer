import { findSequence } from '../utils/findSequence.js'
import { FIELD_SIZE } from './reader.js'

const INT_ROWCOUNT = 4
const VDATA_MAGIC = [0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb]
const MIN_FILE_SIZE = (INT_ROWCOUNT + VDATA_MAGIC.length)

export interface DatFile {
  memsize: number
  rowCount: number
  rowLength: number
  dataFixed: Uint8Array
  dataVariable: Uint8Array
  readerFixed: DataView
  readerVariable: DataView
  fieldSize: typeof FIELD_SIZE
}

export function readDatFile (filenameOrExt: string, content: ArrayBuffer): DatFile {
  if (content.byteLength < MIN_FILE_SIZE) {
    throw new Error('Invalid file size.')
  }
  if (!filenameOrExt.endsWith('datc64')) {
    throw new Error('Only datc64 files are supported.')
  }

  const file = new Uint8Array(content)
  const fileReader = new DataView(file.buffer)

  const rowCount = fileReader.getUint32(0, true)
  const boundary = findAlignedSequence(file.subarray(INT_ROWCOUNT), VDATA_MAGIC, rowCount)
  if (boundary === -1) {
    throw new Error('Invalid file: section with variable data not found.')
  }
  const rowLength = rowCount > 0
    ? boundary / rowCount
    : 0

  const dataFixed = file.subarray(INT_ROWCOUNT, INT_ROWCOUNT + boundary)
  const dataVariable = file.subarray(INT_ROWCOUNT + boundary)

  const readerFixed = new DataView(dataFixed.buffer, dataFixed.byteOffset, dataFixed.byteLength)
  const readerVariable = new DataView(dataVariable.buffer, dataVariable.byteOffset, dataVariable.byteLength)

  return {
    memsize: 8,
    rowCount,
    rowLength,
    dataFixed,
    dataVariable,
    readerFixed,
    readerVariable,
    fieldSize: FIELD_SIZE
  }
}

function findAlignedSequence (data: Uint8Array, sequence: number[], elementCount: number): number {
  let fromIndex = 0
  for (;;) {
    const idx = findSequence(data, sequence, fromIndex)
    if (idx === -1) return -1

    if (idx % elementCount === 0) {
      return idx
    } else {
      fromIndex = idx + 1
    }
  }
}
