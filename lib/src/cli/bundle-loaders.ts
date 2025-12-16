import { decompressSliceInBundle } from '../bundles/bundle.js'
import { getFileInfo, readIndexBundle } from '../bundles/index-bundle.js'
import * as fs from 'fs/promises'
import * as path from 'path'

const BUNDLE_DIR = 'Bundles2'

export class FileLoader {
  private bundleCache = new Map<string, Uint8Array>()

  private constructor (
    private bundleLoader: IBundleLoader,
    private index: {
      bundlesInfo: Uint8Array
      filesInfo: Uint8Array
    }
  ) {}

  static async create (bundleLoader: IBundleLoader) {
    console.log('Loading bundles index...')

    const indexBin = await bundleLoader.fetchFile('_.index.bin')
    const indexBundle = decompressSliceInBundle(indexBin)
    const _index = readIndexBundle(indexBundle)

    return new FileLoader(bundleLoader, {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
    })
  }

  private async fetchBundle (name: string) {
    let bundleBin = this.bundleCache.get(name)
    if (!bundleBin) {
      bundleBin = await this.bundleLoader.fetchFile(name)
      this.bundleCache.set(name, bundleBin)
    }
    return bundleBin
  }

  async getFileContents (fullPath: string): Promise<Uint8Array> {
    const contents = await this.tryGetFileContents(fullPath)
    if (!contents) {
      throw new Error(`File no longer exists: ${fullPath}`)
    }
    return contents
  }

  async tryGetFileContents (fullPath: string): Promise<Uint8Array | null> {
    const location = getFileInfo(fullPath, this.index.bundlesInfo, this.index.filesInfo)
    if (!location) return null

    const bundleBin = await this.fetchBundle(location.bundle)
    return decompressSliceInBundle(bundleBin, location.offset, location.size)
  }

  clearBundleCache () {
    this.bundleCache.clear()
  }
}

interface IBundleLoader {
  fetchFile: (name: string) => Promise<Uint8Array>
}

export class CdnBundleLoader implements IBundleLoader {
  private constructor (
    private cacheDir: string,
    private patchVer: string
  ) {}

  static async create (cacheRoot: string, patchVer: string) {
    const cacheDir = path.join(cacheRoot, patchVer)
    try {
      await fs.access(cacheDir)
    } catch {
      console.log('Creating new bundle cache...')
      await fs.rm(cacheRoot, { recursive: true, force: true })
      await fs.mkdir(cacheDir, { recursive: true })
    }
    return new CdnBundleLoader(cacheDir, patchVer)
  }

  async fetchFile (name: string) {
    const cachedFilePath = path.join(this.cacheDir, name.replace(/\//g, '@'))

    try {
      const bundleBin = await fs.readFile(cachedFilePath)
      return bundleBin
    } catch {}

    console.log(`Loading from CDN: ${name} ...`)

    const webpath = `/${this.patchVer}/${BUNDLE_DIR}/${name}`
    const response = await fetch(
      webpath.startsWith('/4.')
        ? `https://patch-poe2.poecdn.com${webpath}`
        : `https://patch.poecdn.com${webpath}`)
    if (!response.ok) {
      console.error(`Failed to fetch ${name} from CDN.`)
      process.exit(1)
    }
    const bundleBin = await response.arrayBuffer()
    await fs.writeFile(cachedFilePath, Buffer.from(bundleBin, 0, bundleBin.byteLength))
    return new Uint8Array(bundleBin)
  }
}

export class SteamBundleLoader implements IBundleLoader {
  constructor (
    private gameDir: string
  ) {}

  fetchFile (name: string) {
    return fs.readFile(path.join(this.gameDir, BUNDLE_DIR, name))
  }
}
