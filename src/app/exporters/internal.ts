import { Header } from '../viewer/headers'
import { getNamePart } from '../dat/dat-file'

export function exportInternalState (headers: Header[], path: string) {
  headers = headers.filter(({ type }) => type.boolean || type.decimal || type.integer || type.string || type.key)

  return JSON.stringify({
    name: getNamePart(path),
    portable: false, // @TODO: if all types defined before last size_t member, then it's portable schema
    sizeType: 32, // portable schema must be saved with size_t = 64
    headers: headers.map(header => ({
      name: header.name,
      offset: header.offset,
      length: header.length,
      type: header.type
    }))
  }, null, 2)
}
