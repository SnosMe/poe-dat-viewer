
export interface SpriteImage {
  name: string
  spritePath: string
  top: number
  left: number
  width: number
  height: number
}

export function parse (text: string) {
  return text
    .trim()
    .split('\n')
    .map<SpriteImage>((line) => {
      const separated = line.split(' ')
      const top = Number(separated[2])
      const left = Number(separated[3])
      return {
        name: separated[0].slice(1, -1),
        spritePath: separated[1].slice(1, -1),
        top: top,
        left: left,
        width: Number(separated[4]) - top + 1,
        height: Number(separated[5]) - left + 1,
      }
    })
}

export function parseFile (file: Uint8Array) {
  const decoder = new TextDecoder('utf-16le')
  return parse(decoder.decode(file))
}
