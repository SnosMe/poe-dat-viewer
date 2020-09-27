
const PATH_REP_SIZE = (8 /* hash */ + 4 /* offset */ + 4 /* size */ + 4 /* recursiveSize */)
const UTF8_DECODER = new TextDecoder('utf-8')

export function _unpackPaths (pathBundle: Uint8Array, pathReps: Uint8Array) {
  const pathsReader = new DataView(pathReps.buffer, pathReps.byteOffset, pathReps.byteLength)

  const dirMap = new Map<string, string[]>()

  const pathsCount = pathReps.byteLength / PATH_REP_SIZE
  for (let idx = 0; idx < pathsCount; ++idx) {
    const offset = pathsReader.getInt32((PATH_REP_SIZE * idx) + 8, true)
    const size = pathsReader.getInt32((PATH_REP_SIZE * idx) + 8 + 4, true)

    const paths = unpackPaths(pathBundle.subarray(offset, offset + size))
    for (const path of paths) {
      const slashIdx = path.lastIndexOf('/')
      const dir = path.substring(0, slashIdx)
      const fileName = path.substring(slashIdx + 1)

      const files = dirMap.get(dir)
      if (!files) {
        dirMap.set(dir, [fileName])
      } else {
        files.push(fileName)
      }
    }
  }

  return dirMap
}

function unpackPaths (data: Uint8Array) {
  const reader = new DataView(data.buffer, data.byteOffset, data.byteLength)

  let offset = 0
  let baseMode = false
  let bases = [] as string[]
  const paths = [] as string[]

  while (offset <= (data.byteLength - 4)) {
    const idx = (reader.getInt32(offset, true) - 1)
    offset += 4

    if (idx === -1) {
      baseMode = !baseMode
      if (baseMode) {
        bases = []
      }
    } else {
      const nullChar = data.indexOf(0x00, offset)
      let path = UTF8_DECODER.decode(
        data.subarray(offset, nullChar))
      offset = nullChar + 1

      if (idx < bases.length) {
        path = `${bases[idx]}${path}`
      }

      if (baseMode) {
        bases.push(path)
      } else {
        paths.push(path)
      }
    }
  }

  return paths
}
