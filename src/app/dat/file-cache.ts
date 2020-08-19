import { openDB, DBSchema } from 'idb'

export interface FileMeta {
  patch: string | null
  ggpkPath: string
  sha256: string
  size: number
  cachedAt: Date
}

interface PoeDatViewerSchema extends DBSchema {
  'dat-files': {
    key: FileMeta['sha256']
    value: FileMeta
  }
}

const db = openDB<PoeDatViewerSchema>('poe-dat-viewer', 1, {
  upgrade (db) {
    db.createObjectStore('dat-files', { keyPath: 'sha256' })
  }
})

const CACHE_NAME = 'dat-files'

export async function getAllFilesMeta (): Promise<FileMeta[]> {
  return (await db).getAll('dat-files')
}

export async function findByPath (patch: string, ggpkPath: string) {
  const files = await (await db).getAll('dat-files')
  const hash = files.find(file =>
    file.patch === patch &&
    file.ggpkPath === ggpkPath
  )?.sha256

  return hash ? findByHash(hash) : undefined
}

export async function findByHash (sha256: string) {
  const file = await (await db).get('dat-files', sha256)
  if (!file) return

  const cache = await caches.open(CACHE_NAME)
  const res = await cache.match(sha256)
  if (!res) {
    throw new Error('Content for cached file is missing')
  }
  const content = await res.arrayBuffer()
  return { content, meta: file }
}

export async function deleteByHash (sha256: string) {
  await (await db).delete('dat-files', sha256)

  const cache = await caches.open(CACHE_NAME)
  await cache.delete(sha256)
}

export async function putFile (
  patch: string | null,
  ggpkPath: string,
  content: ArrayBuffer
) {
  const digest = await crypto.subtle.digest('SHA-256', content)
  const hash = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  const file = {
    ggpkPath,
    sha256: hash,
    cachedAt: new Date(),
    size: content.byteLength,
    patch
  }

  ;(await db).put('dat-files', file)

  const cache = await caches.open(CACHE_NAME)
  await cache.put(hash, new Response(content, {
    headers: {
      'content-length': String(content.byteLength),
      'content-type': 'application/octet-stream'
    }
  }))

  return { content, meta: file }
}
