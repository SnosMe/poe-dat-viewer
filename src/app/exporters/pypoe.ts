import { Header } from '../viewer/headers'
import { ExporterFieldType, headerToFieldFormat } from './common'
import { getNamePart } from '../dat/dat-file'

export function exportToPypoe (headers: Header[], path: string) {
  let unknownNum = 0
  let undefinedNum = 0

  const fields = headers.flatMap(header => {
    const res = headerToFieldFormat(header, unknownNum, undefinedNum, getPypoeFieldType)
    unknownNum = res.unknownNum
    undefinedNum = res.undefinedNum
    return res.fields
  })

  const fieldsText = fields.map(field => {
    return `        ('${field[0]}', Field(\n            name='${field[0]}',\n            type='${field[1]}',\n        )),`
  }).join('\n')

  return `'${getNamePart(path)}.dat': File(\n    fields=OrderedDict((\n${fieldsText}\n    )),\n),`
}

function getPypoeFieldType (header: Header): ExporterFieldType {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.ref?.array
  const key = header.type.key
  const size = integer?.size || decimal?.size || header.length

  if (integer) {
    if (size === 1 && integer.unsigned && !array) return 'ubyte'
    if (size === 2 && integer.unsigned && !array) return 'ushort'
    if (size === 4 && integer.unsigned && !array) return 'uint'
    if (size === 8 && integer.unsigned && !array) return 'ulong'

    if (size === 1 && !integer.unsigned && !array) return 'byte'
    if (size === 2 && !integer.unsigned && !array) return 'short'
    if (size === 4 && !integer.unsigned && !array) return 'int'
    if (size === 8 && !integer.unsigned && !array) return 'long'

    if (size === 1 && integer.unsigned && array) return 'ref|list|ubyte'
    if (size === 2 && integer.unsigned && array) return 'ref|list|ushort'
    if (size === 4 && integer.unsigned && array) return 'ref|list|uint'
    if (size === 8 && integer.unsigned && array) return 'ref|list|ulong'

    if (size === 1 && !integer.unsigned && array) return 'ref|list|byte'
    if (size === 2 && !integer.unsigned && array) return 'ref|list|short'
    if (size === 4 && !integer.unsigned && array) return 'ref|list|int'
    if (size === 8 && !integer.unsigned && array) return 'ref|list|long'
  }

  if (decimal) {
    if (size === 4 && !array) return 'float'
    if (size === 8 && !array) return 'double'

    if (size === 4 && array) return 'ref|list|float'
    if (size === 8 && array) return 'ref|list|double'
  }

  if (boolean) {
    return array ? 'ref|list|bool' : 'bool'
  }

  if (string) {
    return array ? 'ref|list|ref|string' : 'ref|string'
  }

  if (key && key.foreign) {
    return array ? 'ref|list|ulong' : 'ulong'
  }

  if (key && !key.foreign) {
    return array ? 'ref|list|ref|generic' : 'ref|generic'
  }

  return { byte: 'ubyte' }
}
