import { Header } from '../viewer/headers'

export function headerToPogoFieldFormat (header: Header, unknownNum: number, undefinedNum: number) {
  let fields: Array<[string, string]>

  const type = getPogoFieldType(header)
  if (typeof type === 'string') {
    fields = [
      [header.name! || `Unknown${++unknownNum}`, type]
    ]
  } else {
    fields = new Array(header.length).fill(undefined).map(_ =>
      [`Undefined${++undefinedNum}`, type.byte]
    )
  }

  return { unknownNum, undefinedNum, fields }
}

function getPogoFieldType (header: Header) {
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

    if (size === 4 && !integer.unsigned && !integer.nullable && !array) return 'int32'
    if (size === 8 && !integer.unsigned && !integer.nullable && !array) return 'int64'

    if (size === 1 && integer.unsigned && !integer.nullable && array) return '[]uint8'
    if (size === 2 && integer.unsigned && !integer.nullable && array) return '[]uint16'
    if (size === 4 && integer.unsigned && !integer.nullable && array) return '[]uint32'
    if (size === 8 && integer.unsigned && !integer.nullable && array) return '[]uint64'

    if (size === 4 && !integer.unsigned && !integer.nullable && array) return '[]int32'
    if (size === 8 && !integer.unsigned && !integer.nullable && array) return '[]int64'

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
