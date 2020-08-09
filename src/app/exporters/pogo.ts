import { Header } from '../viewer/headers'
import { ExporterFieldType, headerToFieldFormat } from './common'

export function exportToPogo (headers: Header[], name: string) {
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

  return `type ${name} struct {\n${fieldsText}\n}`
}

function getPogoFieldType (header: Header): ExporterFieldType {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.ref?.array
  const size = integer?.size || decimal?.size || header.length

  if (integer) {
    if (size === 1 && integer.unsigned && !integer.nullable && !array) return 'uint8'
    if (size === 2 && integer.unsigned && !integer.nullable && !array) return 'uint16'
    if (size === 4 && integer.unsigned && !integer.nullable && !array) return 'uint32'
    if (size === 8 && integer.unsigned && !integer.nullable && !array) return 'uint64'

    if (size === 1 && !integer.unsigned && !integer.nullable && !array) return 'uint8' // N/A 'int8'
    if (size === 2 && !integer.unsigned && !integer.nullable && !array) return 'uint16' // N/A 'int16'
    if (size === 4 && !integer.unsigned && !integer.nullable && !array) return 'int32'
    if (size === 8 && !integer.unsigned && !integer.nullable && !array) return 'int64'

    if (size === 1 && integer.unsigned && !integer.nullable && array) return '[]uint8'
    if (size === 2 && integer.unsigned && !integer.nullable && array) return '[]uint16'
    if (size === 4 && integer.unsigned && !integer.nullable && array) return '[]uint32'
    if (size === 8 && integer.unsigned && !integer.nullable && array) return '[]uint64'

    if (size === 1 && !integer.unsigned && !integer.nullable && array) return '[]uint8' // N/A '[]int8'
    if (size === 2 && !integer.unsigned && !integer.nullable && array) return '[]uint16' // N/A '[]int16'
    if (size === 4 && !integer.unsigned && !integer.nullable && array) return '[]int32'
    if (size === 8 && !integer.unsigned && !integer.nullable && array) return '[]int64'

    if (size === 1 && integer.unsigned && integer.nullable && !array) return '*int8' // N/A '*uint8'
    if (size === 2 && integer.unsigned && integer.nullable && !array) return '*int16' // N/A '*uint16'
    if (size === 4 && integer.unsigned && integer.nullable && !array) return '*int32' // N/A '*uint32'
    if (size === 8 && integer.unsigned && integer.nullable && !array) return '*int64' // N/A '*uint64'

    if (size === 1 && !integer.unsigned && integer.nullable && !array) return '*int8' // N/A
    if (size === 2 && !integer.unsigned && integer.nullable && !array) return '*int16' // N/A
    if (size === 4 && !integer.unsigned && integer.nullable && !array) return '*int32'
    if (size === 8 && !integer.unsigned && integer.nullable && !array) return '*int64'
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

  return { byte: 'uint8' }
}
