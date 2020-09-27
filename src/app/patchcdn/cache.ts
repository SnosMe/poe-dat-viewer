import { Notify } from 'quasar'
import Vue from 'vue'

const BUNDLE_DIR = 'Bundles2'

export const progress = Vue.observable({
  totalSize: 0,
  received: 0,
  active: false,
  bundleName: ''
})

export async function fetchFile (patchVer: string | null, name: string) {
  if (patchVer == null) {
    patchVer = localStorage.getItem('POE_PATCH_VER')
    if (!patchVer) throw new Error('never')
  }

  try {
    return await _fetchFile(patchVer, name)
  } catch (e) {
    Notify.create({ color: 'negative', message: e.message, caption: 'You may need to adjust the patch version.', progress: true })
    throw e
  }
}

export async function _fetchFile (patchVer: string, name: string): Promise<ArrayBuffer> {
  const path = `${patchVer}/${BUNDLE_DIR}/${name}`
  let cache = await caches.open('bundles')
  let res = await cache.match(path)
  if (!res) {
    progress.totalSize = 0
    progress.received = 0
    progress.active = true
    progress.bundleName = name

    res = await fetch(`http://poe-bundles.snos.workers.dev/${path}`)
    if (res.status !== 200) {
      progress.active = false
      throw new Error(`patchcdn: ${res.status} ${res.statusText}`)
    }
    progress.totalSize = Number(res.headers.get('content-length'))

    let buf: Uint8Array
    try {
      const reader = res.body!.getReader()
      const chunks = [] as Uint8Array[]
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value!)
        progress.received += value!.length
      }

      buf = new Uint8Array(progress.received)
      let bufPos = 0
      for (const chunk of chunks) {
        buf.set(chunk, bufPos)
        bufPos += chunk.length
      }
    } finally {
      progress.active = false
    }

    if (localStorage.getItem('POE_PATCH_VER') !== patchVer) {
      await caches.delete('bundles')
      cache = await caches.open('bundles')
    }

    await cache.put(path, new Response(buf, {
      headers: {
        'content-length': String(buf.byteLength),
        'content-type': 'application/octet-stream'
      }
    }))
    return buf.buffer
  }
  return res.arrayBuffer()
}
