
export function findSequence (data: Uint8Array, sequence: number[], fromIndex = 0): number {
  for (;;) {
    const idx = data.indexOf(sequence[0], fromIndex)
    if (idx === -1 || (idx + sequence.length) > data.length) return -1

    let matched = true
    for (let di = idx, si = 0; si < sequence.length; ++di, ++si) {
      if (data[di] !== sequence[si]) {
        fromIndex = idx + 1
        matched = false
        break
      }
    }

    if (matched) return idx
  }
}

export function findZeroSequence (data: Uint8Array, count: number, fromIndex = 0): number { /* eslint-disable */
  let idx = 0
  let di = 0
  let si = 0

  outer:
  for (;;) {
    for (idx = fromIndex; fromIndex < data.byteLength; ++idx) {
      if (data[idx] === 0x00) break
    }
    if ((idx + count) > data.length) return -1

    for (di = idx + 1, si = 1; si < count; ++di, ++si) {
      if (data[di] !== 0x00) {
        fromIndex = idx + 1
        continue outer
      }
    }

    return idx
  }
}
