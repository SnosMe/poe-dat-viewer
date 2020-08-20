import { Header } from '../viewer/headers'
import { ExporterFieldType, headerToFieldFormat } from './common'
import { getNamePart } from '../dat/dat-file'

export function exportToPogo (headers: Header[], path: string) {
  let unknownNum = 0
  let undefinedNum = 0

  const fields = headers.flatMap(header => {
    const res = headerToFieldFormat(header, unknownNum, undefinedNum, getPogoFieldType)
    unknownNum = res.unknownNum
    undefinedNum = res.undefinedNum
    return res.fields
  })

  const maxLen = Math.max(...fields.map(field => field[0].length))
  const fieldsText = fields.map(field => {
    field[0] = field[0].padEnd(maxLen, ' ')
    return `  ${field[0]} ${field[1]}`
  }).join('\n')

  return `type ${getNamePart(path)} struct {\n${fieldsText}\n}`
}

function getPogoFieldType (header: Header): ExporterFieldType {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.ref?.array
  const key = header.type.key
  const size = integer?.size || decimal?.size || header.length

  if (integer) {
    if (size === 1 && integer.unsigned && !array) return 'uint8'
    if (size === 2 && integer.unsigned && !array) return 'uint16'
    if (size === 4 && integer.unsigned && !array) return 'uint32'
    if (size === 8 && integer.unsigned && !array) return 'uint64'

    if (size === 1 && !integer.unsigned && !array) return 'uint8' // N/A 'int8'
    if (size === 2 && !integer.unsigned && !array) return 'uint16' // N/A 'int16'
    if (size === 4 && !integer.unsigned && !array) return 'int32'
    if (size === 8 && !integer.unsigned && !array) return 'int64'

    if (size === 1 && integer.unsigned && array) return '[]uint8'
    if (size === 2 && integer.unsigned && array) return '[]uint16'
    if (size === 4 && integer.unsigned && array) return '[]uint32'
    if (size === 8 && integer.unsigned && array) return '[]uint64'

    if (size === 1 && !integer.unsigned && array) return '[]uint8' // N/A '[]int8'
    if (size === 2 && !integer.unsigned && array) return '[]uint16' // N/A '[]int16'
    if (size === 4 && !integer.unsigned && array) return '[]int32'
    if (size === 8 && !integer.unsigned && array) return '[]int64'
  }

  if (decimal) {
    if (size === 4 && !array) return 'float32'
    if (size === 8 && !array) return 'float64'

    if (size === 4 && array) return '[]float32'
    if (size === 8 && array) return '[]float64'
  }

  if (boolean) {
    return array ? '[]bool' : 'bool'
  }

  if (string) {
    return array ? '[]string' : 'string'
  }

  if (key && key.foreign) {
    return array ? '[]int64' : '*int64'
  }

  if (key && !key.foreign) {
    return array ? '[]int32' : '*int32'
  }

  return { byte: 'uint8' }
}
