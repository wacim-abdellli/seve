import { motion } from 'framer-motion'

interface StatBadgeProps {
  color: 'red' | 'amber' | 'blue' | 'green' | 'zinc'
  count?: number
  label: string
  delay?: number
}

const colorMap = {
  red: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  zinc: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' },
}

export default function StatBadge({ color, count, label, delay = 0 }: StatBadgeProps) {
  const s = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg} border border-transparent`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {count !== undefined && <span className={`text-[11px] font-black ${s.text}`}>{count}</span>}
      <span className="text-[10px] font-medium text-zinc-400">{label}</span>
    </motion.div>
  )
}
