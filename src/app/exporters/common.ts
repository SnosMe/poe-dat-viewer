import { Header } from '../viewer/headers'

export type ExporterFieldType = string | { byte: string }

export function headerToFieldFormat (
  header: Header,
  unknownNum: number,
  undefinedNum: number,
  getFieldType: (header: Header) => ExporterFieldType
) {
  let fields: Array<[string, string]>

  const type = getFieldType(header)
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
