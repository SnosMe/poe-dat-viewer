import { BinaryReaderFactory, BinaryReader } from '../utils/BinaryReader'
import { findSequence } from '../utils/findSequence'
import { FIELD_SIZE } from './reader'

const INT_ROWCOUNT = 4
const VDATA_MAGIC = [0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb]
const MIN_FILE_SIZE = (INT_ROWCOUNT + VDATA_MAGIC.length)

export interface DatFile {
  memsize: number
  rowCount: number
  rowLength: number
  dataFixed: Uint8Array
  dataVariable: Uint8Array
  readerFixed: BinaryReader
  readerVariable: BinaryReader
  fieldSize: Record<keyof typeof FIELD_SIZE, number>
}

export function readDatFile (filenameOrExt: string, content: ArrayBuffer): DatFile {
  if (content.byteLength < MIN_FILE_SIZE) {
    throw new Error('Invalid file size')
  }

  const file = new Uint8Array(content)
  const fileReader = new DataView(file.buffer)
  const { memsize } = getInfoFromFilename(filenameOrExt)

  const rowCount = fileReader.getUint32(0, true)
  const boundary = findSequence(file, VDATA_MAGIC)
  if (boundary === -1) {
    throw new Error('Invalid file: section with variable data not found')
  }
  const rowLength = rowCount > 0
    ? (boundary - INT_ROWCOUNT) / rowCount
    : 0

  const dataFixed = file.subarray(INT_ROWCOUNT, boundary)
  const dataVariable = file.subarray(boundary)

  const readerFixed = new DataView(dataFixed.buffer, dataFixed.byteOffset, dataFixed.byteLength)
  const readerVariable = new DataView(dataVariable.buffer, dataVariable.byteOffset, dataVariable.byteLength)

  return {
    memsize,
    rowCount,
    rowLength,
    dataFixed,
    dataVariable,
    readerFixed: BinaryReaderFactory.create(memsize, readerFixed),
    readerVariable: BinaryReaderFactory.create(memsize, readerVariable),
    fieldSize: {
      ...FIELD_SIZE,
      STRING: FIELD_SIZE.STRING[memsize],
      KEY: FIELD_SIZE.KEY[memsize],
      KEY_FOREIGN: FIELD_SIZE.KEY_FOREIGN[memsize],
      ARRAY: FIELD_SIZE.ARRAY[memsize]
    }
  }
}

export function getInfoFromFilename (value: string) {
  const dotIdx = value.lastIndexOf('.')
  const ext = (dotIdx === -1) ? value : value.substr(dotIdx + 1)
  return {
    memsize: getDataModel(ext),
    utfsize: getUtfCodeUnitSize(ext)
  }
}

export function getDataModel (ext: string) {
  switch (ext) {
    case 'dat64':
    case 'datl64':
      return 8
    case 'dat':
    case 'datl':
      return 4
    default:
      throw new Error('Unknown extension')
  }
}

export function getUtfCodeUnitSize (ext: string) {
  switch (ext) {
    case 'datl':
    case 'datl64':
      return 4
    case 'dat':
    case 'dat64':
      return 2
    default:
      throw new Error('Unknown extension')
  }
}
