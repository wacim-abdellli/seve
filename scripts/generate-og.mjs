import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

const canvas = createCanvas(1200, 630)
const ctx = canvas.getContext('2d')

// Background
ctx.fillStyle = '#09090b'
ctx.fillRect(0, 0, 1200, 630)

// Subtle grid
ctx.strokeStyle = 'rgba(255,255,255,0.04)'
ctx.lineWidth = 1
for (let x = 0; x < 1200; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke() }
for (let y = 0; y < 630; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke() }

// Red glow
const glow = ctx.createRadialGradient(600, 200, 0, 600, 200, 500)
glow.addColorStop(0, 'rgba(185,28,28,0.25)')
glow.addColorStop(1, 'transparent')
ctx.fillStyle = glow; ctx.fillRect(0, 0, 1200, 630)

// Logo S with dot
ctx.fillStyle = '#ffffff'
ctx.font = 'bold 120px Georgia, serif'
ctx.textAlign = 'left'
ctx.fillText('S', 80, 240)
ctx.fillStyle = '#b91c1c'
ctx.beginPath(); ctx.arc(218, 148, 14, 0, Math.PI * 2); ctx.fill()
ctx.fillStyle = '#ffffff'
ctx.fillText('eve', 234, 240)

// Tagline
ctx.fillStyle = '#a1a1aa'
ctx.font = '32px system-ui, sans-serif'
ctx.fillText('Free Resume Builder · Smart ATS Checker', 80, 310)

// Badge
ctx.fillStyle = 'rgba(185,28,28,0.15)'
ctx.strokeStyle = 'rgba(185,28,28,0.4)'
ctx.lineWidth = 1.5
roundRect(ctx, 80, 360, 280, 46, 8)
ctx.fill(); ctx.stroke()
ctx.fillStyle = '#f87171'
ctx.font = 'bold 20px system-ui, sans-serif'
ctx.fillText('No sign-up required', 100, 390)

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y)
  ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r)
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h)
  ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r)
  ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath()
}

writeFileSync('public/og-preview.png', canvas.toBuffer('image/png'))
console.log('✓ og-preview.png generated')
