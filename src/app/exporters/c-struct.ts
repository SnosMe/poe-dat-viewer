import { Header } from '../viewer/headers'
import { ExporterFieldType, headerToFieldFormat } from './common'
import { getNamePart } from '../dat/dat-file'

export function exportToClang (headers: Header[], path: string) {
  let unknownNum = 0
  let undefinedNum = 0

  const fields = headers.flatMap(header => {
    const res = headerToFieldFormat(header, unknownNum, undefinedNum, getClangFieldType)
    unknownNum = res.unknownNum
    undefinedNum = res.undefinedNum
    return res.fields
  })

  const fieldsText = fields.map(field => {
    return `  ${field[1]} ${field[0]};`
  }).join('\n')

  return `#include <stdbool.h>\n#include <stdint.h>\n#include <uchar.h>\n\n#pragma pack(push, 1)\ntypedef struct ${getNamePart(path)} {\n${fieldsText}\n} ${getNamePart(path)};\n#pragma pack(pop)`
}

function getClangFieldType (header: Header): ExporterFieldType {
  const boolean = header.type.boolean
  const integer = header.type.integer
  const decimal = header.type.decimal
  const string = header.type.string
  const array = header.type.ref?.array
  const key = header.type.key
  const size = integer?.size || decimal?.size || header.length

  if (integer) {
    if (size === 1 && integer.unsigned && !array) return 'uint8_t'
    if (size === 2 && integer.unsigned && !array) return 'uint16_t'
    if (size === 4 && integer.unsigned && !array) return 'uint32_t'
    if (size === 8 && integer.unsigned && !array) return 'uint64_t'

    if (size === 1 && !integer.unsigned && !array) return 'int8_t'
    if (size === 2 && !integer.unsigned && !array) return 'int16_t'
    if (size === 4 && !integer.unsigned && !array) return 'int32_t'
    if (size === 8 && !integer.unsigned && !array) return 'int64_t'

    if (size === 1 && integer.unsigned && array) return 'struct { size_t size; uint8_t* offset; }'
    if (size === 2 && integer.unsigned && array) return 'struct { size_t size; uint16_t* offset; }'
    if (size === 4 && integer.unsigned && array) return 'struct { size_t size; uint32_t* offset; }'
    if (size === 8 && integer.unsigned && array) return 'struct { size_t size; uint64_t* offset; }'

    if (size === 1 && !integer.unsigned && array) return 'struct { size_t size; int8_t* offset; }'
    if (size === 2 && !integer.unsigned && array) return 'struct { size_t size; int16_t* offset; }'
    if (size === 4 && !integer.unsigned && array) return 'struct { size_t size; int32_t* offset; }'
    if (size === 8 && !integer.unsigned && array) return 'struct { size_t size; int64_t* offset; }'
  }

  if (decimal) {
    if (size === 4 && !array) return 'float'
    if (size === 8 && !array) return 'double'

    if (size === 4 && array) return 'struct { size_t size; float* offset; }'
    if (size === 8 && array) return 'struct { size_t size; double* offset; }'
  }

  if (boolean) {
    return array ? 'struct { size_t size; bool* offset; }' : 'bool'
  }

  if (string) {
    return array ? 'struct { size_t size; char16_t** offset; }' : 'char16_t*'
  }

  if (key && key.foreign) {
    return array ? 'struct { size_t size; struct { size_t rid; void* unknown; } *offset; }' : '{ size_t rid; void* unknown; }'
  }

  if (key && !key.foreign) {
    return array ? 'struct { size_t size; size_t* offset; }' : 'size_t'
  }

  return { byte: 'uint8_t' }
}
