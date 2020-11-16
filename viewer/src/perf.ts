
export function start () {
  return Date.now()
}

export function end (desc: string, start: number) {
  const end = Date.now() - start
  console.log(`${desc}. Done in -> ${end} ms`)
}

export function fn<T> (desc: string, cb: () => T): T {
  const t$ = start()
  const res = cb()
  end(desc, t$)
  return res
}
