import { MetricLCS } from 'string-metric'
import type { TableStats } from '@/app/dat-viewer/db.js'

export function foreignTableSuggestions (
  thisTable: string,
  maxKeyRid: number,
  tableStats: readonly TableStats[]
): TableStats[] {
  thisTable = thisTable.toLowerCase()

  const filteredTables: TableStats[] = []
  const wRidDiffs: number[] = []
  const wNameDistances: number[] = []

  const metric = new MetricLCS()
  for (const table of tableStats) {
    if (maxKeyRid >= table.totalRows ||
      table.name.toLowerCase() === thisTable) continue

    filteredTables.push(table)
    wRidDiffs.push(table.totalRows - (maxKeyRid + 1))
    wNameDistances.push(metric.distance(thisTable, table.name.toLowerCase()))
  }

  const wTotal: number[] = new Array(filteredTables.length).fill(0)
  for (const weights of [wRidDiffs, wNameDistances]) {
    const min = Math.min(...weights)
    const max = Math.max(...weights)
    for (let i = 0; i < weights.length; i += 1) {
      const w = (weights[i] - min) / (max - min)
      if (w > 0.33) wTotal[i] += w
    }
  }

  const indirect: number[] = new Array(filteredTables.length).fill(0).map((_, i) => i)
  indirect.sort((a, b) => wTotal[a] - wTotal[b])

  return indirect.map(idx => filteredTables[idx])
}
