import { decompressBundle } from './bundle'

// https://github.com/poe-tool-dev/ggpk.discussion/wiki/Bundle-scheme#bundle-index-format

export interface IndexBundle {
  name: string
  uncompressedSize: number
}

export interface IndexFile {
  hash: string
  bundleIdx: number
  offset: number
  size: number
}

export interface IndexPath {
  hash: string
  offset: number
  size: number
  recursiveSize: number
}

export async function bundleIndex (bundle: Uint8Array) {
  const reader = new DataViewStream(bundle)

  const bundlesCount = reader.getInt32()
  const bundles = new Array(bundlesCount).fill(undefined)
    .map<IndexBundle>(_ => ({
      name: reader.getUtf8String(reader.getInt32()),
      uncompressedSize: reader.getInt32()
    }))

  const filesCount = reader.getInt32()
  const files = new Array(filesCount).fill(undefined)
    .map<IndexFile>(_ => ({
      hash: reader.getHash64(),
      bundleIdx: reader.getInt32(),
      offset: reader.getInt32(),
      size: reader.getInt32()
    }))

  const pathsCount = reader.getInt32()
  const paths = new Array(pathsCount).fill(undefined)
    .map<IndexPath>(_ => ({
      hash: reader.getHash64(),
      offset: reader.getInt32(),
      size: reader.getInt32(),
      recursiveSize: reader.getInt32()
    }))

  const pathBundleBin = bundle.buffer.slice(reader.offset)
  const pathBundle = await decompressBundle(pathBundleBin)

  const unpackedPaths = paths.flatMap(p => unpackPaths(pathBundle.subarray(p.offset, p.offset + p.size)))
  console.assert(unpackedPaths.length === filesCount)

  return {
    bundles,
    files,
    paths: unpackedPaths
  }
}

function unpackPaths (data: Uint8Array) {
  const reader = new DataViewStream(data)

  let baseMode = false
  let bases = [] as string[]
  const paths = [] as string[]

  while (reader.offset <= (data.byteLength - 4)) {
    let idx = reader.getInt32()
    const isModeSwitch = (idx === 0)
    if (isModeSwitch) {
      baseMode = !baseMode
      if (baseMode) {
        bases = []
      }
    } else {
      idx -= 1

      let path = reader.getZutf8String()
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

class DataViewStream {
  private utf8Decoder = new TextDecoder('utf-8')
  private view: DataView
  private data: Uint8Array
  offset = 0

  constructor (data: Uint8Array) {
    this.view = new DataView(data.buffer)
    this.data = data
  }

  getInt32 () {
    const value = this.view.getInt32(this.data.byteOffset + this.offset, true)
    this.offset += 4
    return value
  }

  getUtf8String (length: number) {
    const str = this.utf8Decoder.decode(
      this.data.subarray(this.offset, this.offset + length)
    )
    this.offset += length
    return str
  }

  getZutf8String () {
    const end = this.data.indexOf(0x00, this.offset)
    const str = this.utf8Decoder.decode(
      this.data.subarray(this.offset, end)
    )
    this.offset = end + 1
    return str
  }

  getHash64 () {
    const hash = Array.from(
      this.data.subarray(this.offset, this.offset + 8)
    )
      .reverse()
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    this.offset += 8

    return hash
  }
}
