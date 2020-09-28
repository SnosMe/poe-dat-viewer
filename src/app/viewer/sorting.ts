import { Header } from './headers'

export function sortRows (header: Header, order: 1 | -1): number[] {
  const { entriesRaw } = header.cachedView!
  const rows = entriesRaw.map((_, idx) => idx)

  if (header.type.ref?.array) {
    rows.sort((ai, bi) => {
      const a = entriesRaw[ai] as unknown[]
      const b = entriesRaw[bi] as unknown[]
      return (b.length - a.length) * order
    })
  } else {
    if (header.type.boolean) {
      rows.sort((ai, bi) => {
        const a = Number(entriesRaw[ai] as boolean)
        const b = Number(entriesRaw[bi] as boolean)
        return (a - b) * order
      })
    } else if (header.type.string) {
      rows.sort((ai, bi) => {
        const a = entriesRaw[ai] as string
        const b = entriesRaw[bi] as string
        return a.localeCompare(b) * order
      })
    } else if (header.type.integer || header.type.decimal) {
      rows.sort((ai, bi) => {
        const a = entriesRaw[ai] as number
        const b = entriesRaw[bi] as number
        return (b - a) * order
      })
    } else if (header.type.key) {
      if (header.type.key.foreign) {
        rows.sort((ai, bi) => {
          const a = entriesRaw[ai] as { rid: number, unknown: number } | null
          const b = entriesRaw[bi] as { rid: number, unknown: number } | null
          return ((b?.rid || 0) - (a?.rid || 0)) * order
        })
      } else {
        rows.sort((ai, bi) => {
          const a = Number(entriesRaw[ai] as number | null)
          const b = Number(entriesRaw[bi] as number | null)
          return (b - a) * order
        })
      }
    }
  }

  return rows
}
