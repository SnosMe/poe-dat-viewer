import { toCdnUrl, BUNDLES_DIR, BundleLoader, FileLoader as BaseFileLoader } from '../bundles/load-util.js'
import * as fs from 'fs/promises'
import * as path from 'path'

export const FileLoader = BaseFileLoader
export type FileLoader = BaseFileLoader<CachingBundleLoader>

export class CachingBundleLoader implements BundleLoader {
  private bundleCache = new Map<string, Uint8Array>()

  constructor (
    private loader: BundleLoader
  ) {}

  async fetchFile (name: string) {
    let bundleBin = this.bundleCache.get(name)
    if (!bundleBin) {
      bundleBin = await this.loader.fetchFile(name)
      this.bundleCache.set(name, bundleBin)
    }
    return bundleBin
  }

  clearBundleCache () {
    this.bundleCache.clear()
  }
}

export class CdnBundleLoader implements BundleLoader {
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

    const response = await fetch(toCdnUrl(this.patchVer, name))
    if (!response.ok) {
      console.error(`Failed to fetch ${name} from CDN.`)
      process.exit(1)
    }
    const bundleBin = await response.arrayBuffer()
    await fs.writeFile(cachedFilePath, Buffer.from(bundleBin, 0, bundleBin.byteLength))
    return new Uint8Array(bundleBin)
  }
}

export class SteamBundleLoader implements BundleLoader {
  constructor (
    private gameDir: string
  ) {}

  fetchFile (name: string) {
    return fs.readFile(path.join(this.gameDir, BUNDLES_DIR, name))
  }
}
