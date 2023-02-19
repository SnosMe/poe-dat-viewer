import { parseFile as parseSpriteIndex, SpriteImage } from '../sprites/layout-parser.js'
import type { ExportConfig } from './ExportConfig.js'
import { FileLoader } from './bundle-loaders.js'
import { spawn } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'

const SPRITE_LISTS = [{
  path: 'Art/UIImages1.txt',
  namePrefix: 'Art/2DArt/UIImages/',
  spritePrefix: 'Art/Textures/Interface/2D/'
}, {
  path: 'Art/UIDivinationImages.txt',
  namePrefix: 'Art/2DItems/Divination/Images/',
  spritePrefix: 'Art/Textures/Interface/2D/DivinationCards/'
}, {
  path: 'Art/UIShopImages.txt',
  namePrefix: 'Art/2DArt/Shop/',
  spritePrefix: 'Art/Textures/Interface/2D/Shop/'
}]

function isInsideSprite (path: string) {
  return SPRITE_LISTS.some(list => path.startsWith(list.namePrefix))
}

export async function exportFiles (
  config: ExportConfig,
  outDir: string,
  loader: FileLoader
) {
  if (!config.files?.length) return

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  // export from sprites
  {
    const PARSED_LISTS: SpriteImage[][] = []
    for (const sprite of SPRITE_LISTS) {
      const file = await loader.getFileContents(sprite.path)
      PARSED_LISTS.push(parseSpriteIndex(file))
    }

    const images = config.files
      .filter(isInsideSprite)
      .map(path => {
        const idx = SPRITE_LISTS.findIndex(list => path.startsWith(list.namePrefix))
        return PARSED_LISTS[idx].find(img => img.name === path)!
      })

    const bySprite = images.reduce<Array<{
      path: string
      images: SpriteImage[]
    }>>((bySprite, img) => {
      const found = bySprite.find(sprite => sprite.path === img.spritePath)
      if (found) {
        found.images.push(img)
      } else {
        bySprite.push({ path: img.spritePath, images: [img] })
      }
      return bySprite
    }, [])

    for (const sprite of bySprite) {
      const ddsFile = await loader.getFileContents(sprite.path)
      for (const image of sprite.images) {
        await imagemagickConvertDDS(ddsFile, image, path.join(outDir, `${image.name.replace(/\//g, '@')}.png`))
      }
    }
  }

  // export regular files
  {
    const files = config.files.filter(path => !isInsideSprite(path))
    for (const filePath of files) {
      if (filePath.endsWith('.dds')) {
        await imagemagickConvertDDS(
          await loader.getFileContents(filePath),
          null,
          path.join(outDir, filePath.replace(/\//g, '@').replace(/\.dds$/, '.png'))
        )
      } else {
        await fs.writeFile(
          path.join(outDir, filePath.replace(/\//g, '@')),
          await loader.getFileContents(filePath)
        )
      }
    }
  }
}

function imagemagickConvertDDS (
  ddsFile: Uint8Array,
  crop: { width: number, height: number, top: number, left: number } | null,
  outName: string
) {
  const cropArg = (crop) ? `${crop.width}x${crop.height}+${crop.top}+${crop.left}` : '100%'
  return new Promise<void>((resolve, reject) => {
    const magick = spawn('magick', ['dds:-', '-crop', cropArg, outName], { stdio: ['pipe', 'ignore', 'ignore'] })
    magick.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`imagemagick exited with code ${code}.`))
      }
    })
    magick.stdin.write(ddsFile)
    magick.stdin.end()
  })
}
