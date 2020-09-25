import * as Ooz from 'ooz-wasm'

// https://github.com/poe-tool-dev/ggpk.discussion/wiki/Bundle-scheme#bundle-file-format
const DECOMPRESSED_DATA_SIZE = 0
const CHUNK_COUNT = 36
const COMPRESSION_GRANULARITY = 40
const CHUNK_SIZES = 60

export async function decompressBundle (bundle: ArrayBuffer): Promise<Uint8Array> {
  const reader = new DataView(bundle)
  const decomprDataSize = reader.getInt32(DECOMPRESSED_DATA_SIZE, true)
  const chunkCount = reader.getInt32(CHUNK_COUNT, true)
  const compressionGranularity = reader.getInt32(COMPRESSION_GRANULARITY, true)

  const decomprData = new Uint8Array(decomprDataSize)

  let chunkOffset = CHUNK_SIZES + (chunkCount * 4)
  let decomprOffset = 0
  for (let idx = 0; idx < chunkCount; idx += 1) {
    const chunkSize = reader.getInt32(CHUNK_SIZES + (idx * 4), true)
    const chunk = new Uint8Array(bundle, chunkOffset, chunkSize)

    const decomprChunkSize = (idx === chunkCount - 1)
      ? decomprDataSize % compressionGranularity
      : compressionGranularity

    const raw = await Ooz.decompressUnsafe(chunk, decomprChunkSize)
    decomprData.set(raw, decomprOffset)

    decomprOffset += decomprChunkSize
    chunkOffset += chunkSize
  }

  return decomprData
}
