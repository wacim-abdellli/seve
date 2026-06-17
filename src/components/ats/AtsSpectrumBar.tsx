import { motion } from 'framer-motion'

interface AtsSpectrumBarProps {
  score: number
}

export default function AtsSpectrumBar({ score }: AtsSpectrumBarProps) {
  return (
    <div className="w-full">
      <div className="relative h-3 bg-zinc-800/60 rounded-full overflow-hidden mb-1.5">
        <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to right, #ef4444, #f97316 28%, #eab308 52%, #22c55e 76%, #10b981)' }} />
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white rounded-full shadow-xl shadow-black/60 border-[3px] border-zinc-900 -ml-[9px] z-10"
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-600 font-medium px-0.5">
        <span>Poor</span>
        <span>Fair</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>
    </div>
  )
}
