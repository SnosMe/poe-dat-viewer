export interface DatFile {
  name: string
  rowCount: number
  rowLength: number
  dataFixed: Uint8Array
  dataVariable: Uint8Array
  readerFixed: DataView
  readerVariable: DataView
}

export async function importDatFile (name: string): Promise<DatFile> {
  const file = new Uint8Array(await loadFile(name))
  const fileReader = new DataView(file.buffer)

  const rowCount = fileReader.getUint32(0, true)
  const boundary = findBBBB(file)
  const rowLength = (boundary - 4) / rowCount

  const dataFixed = file.subarray(4, boundary)
  const dataVariable = file.subarray(boundary)

  const readerFixed = new DataView(dataFixed.buffer, dataFixed.byteOffset, dataFixed.byteLength)
  const readerVariable = new DataView(dataVariable.buffer, dataVariable.byteOffset, dataVariable.byteLength)

  return Object.freeze({
    name,
    rowCount,
    rowLength,
    dataFixed,
    dataVariable,
    readerFixed,
    readerVariable
  })
}

async function loadFile (name: string): Promise<ArrayBuffer> {
  const FILE_URL = `http://patch.poecdn.com/patch/3.11.1.4/Data/${name}.dat`

  const cache = await caches.open('poecdn')
  let res = await cache.match(FILE_URL)
  if (!res) {
    res = await fetch(`https://cors-anywhere.herokuapp.com/${FILE_URL}`)
    const buff = await res.arrayBuffer()
    await cache.put(FILE_URL, new Response(buff))
    return buff
  } else {
    return res.arrayBuffer()
  }
}

function findBBBB (data: Uint8Array): number {
  return findSequence([0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb, 0xbb])

  function findSequence (sequence: number[], fromIndex = 0): number {
    const idx = data.indexOf(sequence[0], fromIndex)
    if (idx === -1 || (idx + sequence.length) > data.length) return -1

    for (let di = idx, si = 0; si < sequence.length; di += 1, si += 1) {
      if (data[di] !== sequence[si]) {
        return findSequence(sequence, di)
      }
    }

    return idx
  }
}
