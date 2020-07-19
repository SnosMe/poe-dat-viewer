import { ftext } from './BaseItemTypes'

const LINE = (num: number) => num - 1

export function parse () {
  const lines = ftext.split('\n').map(line => line.trim())

  const out = {
    name: lines[LINE(1)],
    rows: [] as Uint8Array[],
    variableData: new Map<string, string | Uint8Array>()
  }

  const rowNum = Number(lines[LINE(2)].match(/^(\d+) rows, (\d+) bytes per row$/)![1])

  out.rows = lines.slice(LINE(8), LINE(8) + rowNum)
    .map(line => {
      const [_ln, data] = line.split(': ', 2)
      return new Uint8Array(
        data.split(' ').map(hex => parseInt(hex, 16))
      )
    })

  out.variableData = new Map<string, string | Uint8Array>(
    lines.slice(LINE(8) + rowNum + 6, lines.length - 2)
      .map(line => {
        const [addr, data] = line.split(': ', 2)
        if (data.startsWith('"')) {
          return [addr, data.slice(1, -1)]
        } else {
          return [addr, new Uint8Array(
            data.split(' ').map(hex => parseInt(hex, 16))
          )]
        }
      })
  )

  return out
}
