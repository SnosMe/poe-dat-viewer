import { singular } from 'pluralize'
import type { TableStats } from '@/app/dat-viewer/db.js'

function quickSimilar (a: string[], b: string[]): number {
  let common = 0
  for (let i = 0; i < a.length; i += 1) {
    const idx = b.indexOf(a[i])
    if (idx === -1) continue

    common += 1
    if (i === 0 && idx === 0) {
      common += 2
    }
    if (i > 0 && idx > 0) {
      if (a[i - 1] === b[idx - 1]) common += 1
    }
    if (i < (a.length - 1) && idx < (b.length - 1)) {
      if (a[i + 1] === b[idx + 1]) common += 1
    }
  }
  return common
}

const WORDS_REGEX = /([A-Z][a-z]+|[A-Z]{2,}(?![a-z]{2,}))/g

export function foreignTableSuggestions (
  thisTable: string,
  maxKeyRid: number,
  tableStats: readonly TableStats[]
): TableStats[] {
  const filtered = tableStats
    .filter(table => {
      return (maxKeyRid < table.totalRows) && table.name !== thisTable
    })

  const refWords = thisTable.match(WORDS_REGEX)!.map(word => singular(word))
  const weights = filtered.map((table, idx) => {
    const words = table.name.match(WORDS_REGEX)!.map(word => singular(word))
    return [
      idx,
      (maxKeyRid - table.totalRows),
      quickSimilar(words, refWords)
    ]
  })

  const weightsLen = weights[0].length
  const wMin = new Array(weightsLen).fill(+Infinity)
  const wMax = new Array(weightsLen).fill(-Infinity)
  for (let i = 0; i < weights.length; i += 1) {
    for (let j = 1; j < weightsLen; j += 1) {
      const value = weights[i][j]
      if (value < wMin[j]) wMin[j] = value
      if (value > wMax[j]) wMax[j] = value
    }
  }
  for (let j = 1; j < weightsLen; j += 1) {
    if (wMin[j] !== wMax[j]) {
      for (let i = 0; i < weights.length; i += 1) {
        weights[i][j] = (weights[i][j] - wMin[j]) / (wMax[j] - wMin[j])
      }
    }
  }
  weights.sort((w1, w2) =>
    (w2.reduce((a, b) => a + b) - w2[0]) -
    (w1.reduce((a, b) => a + b) - w1[0]))

  return weights.map(([idx]) => filtered[idx])
}
