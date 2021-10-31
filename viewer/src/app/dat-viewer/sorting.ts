import { readColumn, DatFile, Header } from 'pathofexile-dat'

export function sortRows (header: Header, order: 1 | -1, datFile: DatFile): number[] {
  const data = readColumn(header, datFile)

  const rows = Array.from({ length: datFile.rowCount }, (_, idx) => idx)
  if (header.type.array) {
    rows.sort((ai, bi) => {
      const a = data[ai] as unknown[]
      const b = data[bi] as unknown[]
      return (b.length - a.length) * order
    })
  } else {
    if (header.type.boolean) {
      rows.sort((ai, bi) => {
        const a = Number(data[ai] as boolean)
        const b = Number(data[bi] as boolean)
        return (a - b) * order
      })
    } else if (header.type.string) {
      rows.sort((ai, bi) => {
        const a = data[ai] as string
        const b = data[bi] as string
        return a.localeCompare(b) * order
      })
    } else if (header.type.integer || header.type.decimal) {
      rows.sort((ai, bi) => {
        const a = data[ai] as number
        const b = data[bi] as number
        return (b - a) * order
      })
    } else if (header.type.key) {
      if (header.type.key.foreign) {
        rows.sort((ai, bi) => {
          const a = data[ai] as number | null
          const b = data[bi] as number | null
          return ((b || 0) - (a || 0)) * order
        })
      } else {
        rows.sort((ai, bi) => {
          const a = Number(data[ai] as number | null)
          const b = Number(data[bi] as number | null)
          return (b - a) * order
        })
      }
    }
  }

  return rows
}
