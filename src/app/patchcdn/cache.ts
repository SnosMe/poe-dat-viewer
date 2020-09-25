import { getNamePart } from '../dat/dat-file'
import { decompressBundle } from './bundle'
import { bundleIndex } from './bundle-index'

const BUNDLE_DIR = 'Bundles2'

async function loadIndexBin () {
  const cache = await caches.open('bundles')

  let res = await cache.match('_.index.bin')
  if (!res) {
    const FILE_URL = `http://patchcdn.pathofexile.com/3.12.2.2/${BUNDLE_DIR}/_.index.bin`
    res = await fetch(`https://cors-anywhere.herokuapp.com/${FILE_URL}`)
    const buf = await res.arrayBuffer()
    await cache.put('_.index.bin', new Response(buf, {
      headers: {
        'content-length': String(buf.byteLength),
        'content-type': 'application/octet-stream'
      }
    }))
    return buf
  }
  return res.arrayBuffer()
}

export async function playground () {
  const indexBin = await loadIndexBin()

  console.time('decompressBundle')
  const index = await decompressBundle(indexBin)
  console.timeEnd('decompressBundle')
  const bundle = await bundleIndex(index)

  const paths = bundle.paths.filter(path => path.endsWith('.dat') || path.endsWith('.dat64'))

  console.log(paths)

  const tables = new Map<string, {
    name: string
    hasTranslation: boolean
  }>()

  for (const path of paths) {
    const name = getNamePart(path)
    let entry = tables.get(name)
    if (!entry) {
      entry = {
        name,
        hasTranslation: false
      }
      tables.set(name, entry)
    }

    if (!entry.hasTranslation && path.startsWith('Data/Russian/')) {
      entry.hasTranslation = true
    }

    if (!path.startsWith('Data/')) {
      console.log('not in dat folder', path)
    }
  }

  for (const tbl of tables.values()) {
    if (!tbl.hasTranslation) {
      // console.log('not tr in all langs', tbl.name)
    }
  }
}
