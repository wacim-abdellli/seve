import { motion } from 'framer-motion'

interface AtsScoreGaugeProps {
  score: number
  size?: number
  animated?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 70) return '#f59e0b'
  if (score >= 50) return '#f97316'
  return '#ef4444'
}

export default function AtsScoreGauge({ score, size = 168, animated = true }: AtsScoreGaugeProps) {
  const stroke = 10
  const r = (size - stroke * 2) / 2
  const c = r * 2 * Math.PI
  const color = getScoreColor(score)
  const offset = c - (score / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <div className="absolute rounded-full blur-3xl opacity-20" style={{ width: size + 28, height: size + 28, background: color }} />
      <svg width={size} height={size} className="-rotate-90 drop-shadow-lg">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={animated ? { strokeDashoffset: c } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
          style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-black text-white tabular-nums tracking-tight leading-none">{score}</span>
        <span className="text-[9px] text-zinc-500 font-semibold tracking-widest uppercase mt-0.5">/ 100</span>
      </div>
    </div>
  )
}
