const { createCanvas } = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')

function createCNCLogo(size, outputPath) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2
  const r = size / 2

  ctx.clearRect(0, 0, size, size)

  // Outermost dark rim
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.99, 0, Math.PI * 2)
  ctx.fillStyle = '#3a2800'
  ctx.fill()

  // Thick gold ring outer
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2)
  const goldGrad = ctx.createRadialGradient(
    cx * 0.7, cy * 0.65, 0,
    cx, cy, r * 0.95
  )
  goldGrad.addColorStop(0, '#fff4b0')
  goldGrad.addColorStop(0.3, '#FFD700')
  goldGrad.addColorStop(0.7, '#c8980a')
  goldGrad.addColorStop(1, '#6b4e00')
  ctx.fillStyle = goldGrad
  ctx.fill()

  // Inner dark ring separator
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.70, 0, Math.PI * 2)
  ctx.fillStyle = '#2a1c00'
  ctx.fill()

  // Inner gold ring
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.67, 0, Math.PI * 2)
  const goldGrad2 = ctx.createRadialGradient(
    cx * 0.75, cy * 0.7, 0,
    cx, cy, r * 0.67
  )
  goldGrad2.addColorStop(0, '#ffe87a')
  goldGrad2.addColorStop(0.5, '#FFD700')
  goldGrad2.addColorStop(1, '#8B6500')
  ctx.fillStyle = goldGrad2
  ctx.fill()

  // Blue coin face
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2)
  const blueGrad = ctx.createRadialGradient(
    cx * 0.75, cy * 0.7, 0,
    cx, cy, r * 0.58
  )
  blueGrad.addColorStop(0, '#3d8eff')
  blueGrad.addColorStop(0.6, '#0052FF')
  blueGrad.addColorStop(1, '#001e99')
  ctx.fillStyle = blueGrad
  ctx.fill()

  // Subtle inner ring detail on blue
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.53, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(106, 173, 255, 0.35)'
  ctx.lineWidth = size * 0.008
  ctx.stroke()

  // Bold white C letter
  ctx.save()
  const fontSize = Math.round(size * 0.42)
  ctx.font = `900 ${fontSize}px Arial Black`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 0, 128, 0.5)'
  ctx.shadowBlur = size * 0.04
  ctx.fillText('C', cx + size * 0.02, cy + size * 0.02)
  ctx.restore()

  // Two gold horizontal bars through C
  const barWidth = r * 0.28
  const barHeight = r * 0.065
  const barX = cx + r * 0.06
  const bar1Y = cy - r * 0.12
  const bar2Y = cy + r * 0.065
  const barRadius = barHeight / 2

  function roundRect(x, y, w, h, rad) {
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.lineTo(x + w - rad, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
    ctx.lineTo(x + w, y + h - rad)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    ctx.lineTo(x + rad, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
    ctx.closePath()
  }

  ctx.fillStyle = '#FFD700'
  roundRect(barX, bar1Y, barWidth, barHeight, barRadius)
  ctx.fill()

  roundRect(barX, bar2Y, barWidth, barHeight, barRadius)
  ctx.fill()

  // Top shine highlight
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(
    cx - r * 0.12,
    cy - r * 0.28,
    r * 0.22,
    r * 0.12,
    -0.3, 0, Math.PI * 2
  )
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)'
  ctx.fill()
  ctx.restore()

  // Save to file
  const buffer = typeof canvas.encode === 'function'
    ? canvas.encodeSync('png')
    : canvas.toBuffer('image/png')
  fs.writeFileSync(outputPath, buffer)
  console.log(`Created: ${outputPath} (${size}x${size}px)`)
}

const assetsDir = path.join(__dirname, '../src/assets')
const publicDir = path.join(__dirname, '../public')

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true })
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

createCNCLogo(512, path.join(assetsDir, 'cnc-logo.png'))
createCNCLogo(192, path.join(publicDir, 'cnc-logo-192.png'))
createCNCLogo(64, path.join(assetsDir, 'cnc-logo-64.png'))
createCNCLogo(32, path.join(assetsDir, 'cnc-logo-32.png'))

console.log('All CNC logos created successfully!')
