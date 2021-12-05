
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
      const separated = line.match(/^"([^"]+)" "([^"]+)" ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+)$/)!
      const top = Number(separated[3])
      const left = Number(separated[4])
      return {
        name: separated[1],
        spritePath: separated[2],
        top: top,
        left: left,
        width: Number(separated[5]) - top + 1,
        height: Number(separated[6]) - left + 1,
      }
    })
}

export function parseFile (file: Uint8Array) {
  const decoder = new TextDecoder('utf-16le')
  return parse(decoder.decode(file))
}
