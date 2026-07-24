import * as THREE from 'three'

// tasteful, muted trellis pattern — not a flat color, but not a loud print
// either. Drawn on canvas since the project has no texture-loading pipeline
// for image assets.
export function createRugTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const base = '#4a2f52' // muted purple
  const line = '#5c3d66'
  const accent = '#6b4a75'

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = line
  ctx.lineWidth = 3
  const step = size / 8
  for (let i = -8; i <= 16; i++) {
    ctx.beginPath()
    ctx.moveTo(i * step, 0)
    ctx.lineTo(i * step + size, size)
    ctx.stroke()
  }

  ctx.fillStyle = accent
  for (let gx = 0; gx < 8; gx++) {
    for (let gy = 0; gy < 8; gy++) {
      if ((gx + gy) % 2 === 0) continue
      const cx = gx * step + step / 2
      const cy = gy * step + step / 2
      ctx.beginPath()
      ctx.arc(cx, cy, step * 0.12, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // soft border
  ctx.strokeStyle = '#2f1f38'
  ctx.lineWidth = 10
  ctx.strokeRect(5, 5, size - 10, size - 10)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
