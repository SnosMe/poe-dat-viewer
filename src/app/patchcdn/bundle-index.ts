import { decompressBundle, unpackIndexPaths } from '../worker/interface'
import fnv from 'fnv-plus'
import { findSequence } from '../dat/reader'

// https://github.com/poe-tool-dev/ggpk.discussion/wiki/Bundle-scheme#bundle-index-format

export async function readFilesIndex (bundle: Uint8Array) {
  const reader = new DataView(bundle.buffer, bundle.byteOffset, bundle.byteLength)
  let offset = 0

  const bundlesCount = reader.getInt32(offset, true)
  offset += 4
  for (let i = 0; i < bundlesCount; ++i) {
    const nameLen = reader.getInt32(offset, true)
    offset += (4 /* nameLen */ + nameLen /* nameStr */ + 4 /* decompressedSize */)
  }

  const filesCount = reader.getInt32(offset, true)
  offset += 4
  const filesOffset = offset
  offset += filesCount * (8 /* hash */ + 4 /* bundleIdx */ + 4 /* fileOffset */ + 4 /* fileSize */)

  const pathsCount = reader.getInt32(offset, true)
  offset += 4
  const pathsOffset = offset
  const pathsLen = pathsCount * (8 /* hash */ + 4 /* offset */ + 4 /* size */ + 4 /* recursiveSize */)
  offset += pathsLen

  const pathBundleOffset = offset
  const pathBundleBin = bundle.subarray(pathBundleOffset)
  const pathBundle = await decompressBundle(pathBundleBin)

  return {
    filesOffset,
    dirs: await unpackIndexPaths(pathBundle, bundle.subarray(pathsOffset, pathsOffset + pathsLen))
  }
}

export function getFileLocation (bundle: Uint8Array, path: string, filesOffset: number) {
  const hashHex = fnv.fast1a64(path.toLowerCase() + '++')
  const hash = [
    parseInt(hashHex.substr(14, 2), 16),
    parseInt(hashHex.substr(12, 2), 16),
    parseInt(hashHex.substr(10, 2), 16),
    parseInt(hashHex.substr(8, 2), 16),
    parseInt(hashHex.substr(6, 2), 16),
    parseInt(hashHex.substr(4, 2), 16),
    parseInt(hashHex.substr(2, 2), 16),
    parseInt(hashHex.substr(0, 2), 16)
  ]

  const offset = findSequence(bundle, hash, filesOffset)
  if (offset === -1) {
    throw new Error('never')
  }

  const reader = new DataView(bundle.buffer, bundle.byteOffset, bundle.byteLength)
  const bundleIdx = reader.getInt32(offset + 8, true)
  const offsetInBundle = reader.getInt32(offset + 8 + 4, true)
  const fileSize = reader.getInt32(offset + 8 + 4 + 4, true)

  let bundleName: string
  {
    let offset = 4 // <- bundlesCount
    for (let i = 0; i < bundleIdx; ++i) {
      const nameLen = reader.getInt32(offset, true)
      offset += (4 /* nameLen */ + nameLen /* nameStr */ + 4 /* decompressedSize */)
    }
    const nameLen = reader.getInt32(offset, true)
    offset += 4
    bundleName = new TextDecoder('utf-8').decode(bundle.subarray(offset, offset + nameLen))
  }

  return {
    bundle: `${bundleName}.bundle.bin`,
    offset: offsetInBundle,
    size: fileSize
  }
}
