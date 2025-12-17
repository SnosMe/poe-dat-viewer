import { findSequence } from '../utils/findSequence.js'
import { murmur64a } from '../utils/murmur2.js'

// https://github.com/poe-tool-dev/ggpk.discussion/wiki/Bundle-scheme#bundle-index-format

/* eslint-disable */
const S_BUNDLES_COUNT = 4
const SBUNDLE_NAME_LEN             = 4
const SBUNDLE_DECOMPRESSED_SIZE    = 4

const S_FILES_COUNT = 4
const SFILE_HASH         = 8
const SFILE_BUNDLEIDX    = 4
const SFILE_OFFSET       = 4
const SFILE_SIZE         = 4

const S_DIRS_COUNT = 4
const SDIR_HASH           = 8
const SDIR_OFFSET         = 4
const SDIR_DIRECT_SIZE    = 4
const SDIR_ALL_SIZE       = 4
/* eslint-enable */

export interface IndexBundle<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike> {
  bundlesInfo: Uint8Array<TArrayBuffer>
  filesInfo: Uint8Array<TArrayBuffer>
  dirsInfo: Uint8Array<TArrayBuffer>
  pathRepsBundle: Uint8Array<TArrayBuffer>
}

export function readIndexBundle<TArrayBuffer extends ArrayBufferLike> (
  indexBundle: Uint8Array<TArrayBuffer>
): IndexBundle<TArrayBuffer> {
  const reader = new DataView(indexBundle.buffer, indexBundle.byteOffset, indexBundle.byteLength)
  let offset = 0

  let bundlesInfo: Uint8Array<TArrayBuffer>
  {
    const bundlesCount = reader.getInt32(offset, true)
    offset += S_BUNDLES_COUNT

    const begin = offset
    for (let i = 0; i < bundlesCount; ++i) {
      const nameLen = reader.getInt32(offset, true)
      offset += (SBUNDLE_NAME_LEN + nameLen + SBUNDLE_DECOMPRESSED_SIZE)
    }
    const end = offset

    bundlesInfo = indexBundle.subarray(begin, end)
  }

  let filesInfo: Uint8Array<TArrayBuffer>
  {
    const filesCount = reader.getInt32(offset, true)
    offset += S_FILES_COUNT
    const begin = offset
    offset += filesCount * (SFILE_HASH + SFILE_BUNDLEIDX + SFILE_OFFSET + SFILE_SIZE)
    const end = offset

    filesInfo = indexBundle.subarray(begin, end)
  }

  let dirsInfo: Uint8Array<TArrayBuffer>
  {
    const dirsCount = reader.getInt32(offset, true)
    offset += S_DIRS_COUNT
    const begin = offset
    offset += dirsCount * (SDIR_HASH + SDIR_OFFSET + SDIR_DIRECT_SIZE + SDIR_ALL_SIZE)
    const end = offset

    dirsInfo = indexBundle.subarray(begin, end)
  }

  let pathRepsBundle: Uint8Array<TArrayBuffer>
  {
    const begin = offset
    const end = indexBundle.byteLength

    pathRepsBundle = indexBundle.subarray(begin, end)
  }

  return {
    bundlesInfo,
    filesInfo,
    dirsInfo,
    pathRepsBundle
  }
}

export interface FileInfo {
  bundle: string
  offset: number
  size: number
}

export function getFileInfo (path: string, bundlesInfo: Uint8Array, filesInfo: Uint8Array): FileInfo | null {
  const hash = murmur64a(path.toLowerCase())

  const structOffset = findSequence(filesInfo, hash)
  if (structOffset === -1) {
    return null
  }

  const filesReader = new DataView(filesInfo.buffer, filesInfo.byteOffset, filesInfo.byteLength)
  const bundleIdx = filesReader.getInt32(structOffset + SFILE_HASH, true)
  const offsetInBundle = filesReader.getInt32(structOffset + SFILE_HASH + SFILE_BUNDLEIDX, true)
  const fileSize = filesReader.getInt32(structOffset + SFILE_HASH + SFILE_BUNDLEIDX + SFILE_OFFSET, true)

  let bundleName: string
  {
    const bundlesReader = new DataView(bundlesInfo.buffer, bundlesInfo.byteOffset, bundlesInfo.byteLength)
    let offset = 0
    for (let i = 0; i < bundleIdx; ++i) {
      const nameLen = bundlesReader.getInt32(offset, true)
      offset += (SBUNDLE_NAME_LEN + nameLen + SBUNDLE_DECOMPRESSED_SIZE)
    }
    const nameLen = bundlesReader.getInt32(offset, true)
    offset += SBUNDLE_NAME_LEN
    bundleName = new TextDecoder('utf-8').decode(bundlesInfo.subarray(offset, offset + nameLen))
  }

  return {
    bundle: `${bundleName}.bundle.bin`,
    offset: offsetInBundle,
    size: fileSize
  }
}
