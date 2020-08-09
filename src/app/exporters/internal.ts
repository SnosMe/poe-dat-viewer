import { Header } from '../viewer/headers'

export function exportInternalState (headers: Header[], name: string) {
  headers = headers.filter(({ type }) => type.boolean || type.decimal || type.integer || type.string || type.key)

  return JSON.stringify({
    name,
    headers: headers.map(header => ({
      name: header.name,
      offset: header.offset,
      length: header.length,
      type: header.type
    }))
  }, null, 2)
}
