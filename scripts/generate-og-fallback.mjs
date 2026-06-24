import { PNG } from 'pngjs'
import { writeFileSync } from 'fs'

const width = 1200
const height = 630
const png = new PNG({ width, height })

const bg = [9, 9, 11]       // #09090b
const grid = [255, 255, 255]
const glowR = 185
const dotR = 185

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4

    // Background
    png.data[idx] = bg[0]
    png.data[idx + 1] = bg[1]
    png.data[idx + 2] = bg[2]
    png.data[idx + 3] = 255

    // Subtle grid
    if (x % 64 === 0 || y % 64 === 0) {
      png.data[idx] = 255
      png.data[idx + 1] = 255
      png.data[idx + 2] = 255
      png.data[idx + 3] = 10
    }
  }
}

writeFileSync('public/og-preview.png', PNG.sync.write(png))
console.log('✓ og-preview.png generated (fallback)')
