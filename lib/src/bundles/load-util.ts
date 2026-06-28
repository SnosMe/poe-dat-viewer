import { decompressSliceInBundle, decompressedBundleSize } from '../bundles/bundle.js'
import { getFileInfo, readIndexBundle } from '../bundles/index-bundle.js'

export const BUNDLES_DIR = 'Bundles2'

export class FileLoader<T extends BundleLoader = BundleLoader> {
  private constructor (
    readonly bundleLoader: T,
    private index: {
      bundlesInfo: Uint8Array
      filesInfo: Uint8Array
    }
  ) {}

  static async create<T extends BundleLoader> (bundleLoader: T) {
    const indexBin = await bundleLoader.fetchFile('_.index.bin')
    const indexBundle = new Uint8Array(decompressedBundleSize(indexBin))
    decompressSliceInBundle(indexBin, 0, indexBundle)
    const _index = readIndexBundle(indexBundle)

    return new FileLoader(bundleLoader, {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
    })
  }

  async getFileContents (fullPath: string): Promise<Uint8Array> {
    const contents = await this.tryGetFileContents(fullPath)
    if (!contents) throw new NoFileInfoError(fullPath)

    return contents
  }

  async tryGetFileContents (fullPath: string): Promise<Uint8Array | null> {
    const location = getFileInfo(fullPath, this.index.bundlesInfo, this.index.filesInfo)
    if (!location) return null

    const bundleBin = await this.bundleLoader.fetchFile(location.bundle)
    const contents = new Uint8Array(location.size)
    decompressSliceInBundle(bundleBin, location.offset, contents)
    return contents
  }
}

export class NoFileInfoError extends Error {
  constructor (
    readonly path: string
  ) {
    super("The index bundle doesn't contain any information about the path.")
    this.name = 'NoFileInfoError'
    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export interface BundleLoader {
  fetchFile: (relPath: string) => Promise<Uint8Array>
}

export function toCdnUrl (patchVersion: string, relPath: string): string {
  const pathname = `/${patchVersion}/${BUNDLES_DIR}/${relPath}`
  return pathname.startsWith('/4.')
    ? `https://patch-poe2.poecdn.com${pathname}`
    : `https://patch.poecdn.com${pathname}`
}
