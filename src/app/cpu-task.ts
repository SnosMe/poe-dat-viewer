const MAX_PER_FRAME = 10

export const CPUTask = {
  mustYield: (prevTime: number) =>
    (performance.now() - prevTime) >= MAX_PER_FRAME,
  yield: () =>
    new Promise<number>(resolve => requestAnimationFrame(ms => { resolve(ms) }))
}
