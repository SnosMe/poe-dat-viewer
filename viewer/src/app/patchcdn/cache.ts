import { shallowReactive, computed } from 'vue'
import ExpiryMap from 'expiry-map'

const BUNDLE_DIR = 'Bundles2'

export class BundleLoader {
  private patchVer = ''

  private readonly state = shallowReactive({
    totalSize: 0,
    received: 0,
    bundleName: '',
    isDownloading: false,
    active: null as Promise<unknown> | null
  })

  private readonly registry = new FinalizationRegistry<string>(name => {
    console.debug(`[Bundle] garbage-collected, name: "${name}"`)
  })

  private readonly weakCache = new ExpiryMap<string, ArrayBuffer>(20 * 1000)

  async setPatch (version: string) {
    if (this.state.active) {
      await this.state.active
    }
    if (this.patchVer && this.patchVer !== version) {
      this.weakCache.clear()
      await window.caches.delete('bundles')
    }
    this.patchVer = version
  }

  readonly progress = computed(() => {
    return (this.state.isDownloading) ? {
      totalSize: this.state.totalSize,
      received: this.state.received,
      bundleName: this.state.bundleName
    } : null
  })

  async fetchFile (name: string): Promise<ArrayBuffer> {
    let bundle = this.weakCache.get(name)
    if (bundle && bundle.byteLength !== 0) {
      console.log(`[Bundle] name: "${name}", source: memory.`)
      this.weakCache.set(name, bundle) // refresh ttl
      return bundle
    }

    const { state } = this

    if (state.active) {
      await state.active
      return await this.fetchFile(name)
    }

    const promise = this._fetchFile(name)
    state.active = promise
    try {
      bundle = await promise
      this.registry.register(bundle, name)
      this.weakCache.set(name, bundle)
      return bundle
    } catch (e) {
      window.alert('You may need to adjust the patch version.')
      throw e
    } finally {
      state.active = null
    }
  }

  private async _fetchFile (name: string): Promise<ArrayBuffer> {
    const { state, patchVer } = this
    const path = `${patchVer}/${BUNDLE_DIR}/${name}`
    const cache = await window.caches.open('bundles')
    let res = await cache.match(path)
    if (res) {
      console.log(`[Bundle] name: "${name}", source: disk cache.`)
    } else {
      console.log(`[Bundle] name: "${name}", source: network.`)

      state.totalSize = 0
      state.received = 0
      state.isDownloading = true
      state.bundleName = name

      res = await fetch(`https://poe-bundles.snos.workers.dev/${path}`)
      if (res.status !== 200) {
        state.isDownloading = false
        throw new Error(`patchcdn: ${res.status} ${res.statusText}`)
      }
      state.totalSize = Number(res.headers.get('content-length'))

      let buf: Uint8Array
      try {
        const reader = res.body!.getReader()
        const chunks = [] as Uint8Array[]
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          state.received += value.length
        }

        buf = new Uint8Array(state.received)
        let bufPos = 0
        for (const chunk of chunks) {
          buf.set(chunk, bufPos)
          bufPos += chunk.length
        }
      } finally {
        state.isDownloading = false
      }

      await cache.put(path, new Response(buf, {
        headers: {
          'content-length': String(buf.byteLength),
          'content-type': 'application/octet-stream'
        }
      }))
      return buf.buffer
    }
    return await res.arrayBuffer()
  }
}
