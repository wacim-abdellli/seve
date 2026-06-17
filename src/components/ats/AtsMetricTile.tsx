import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface AtsMetricTileProps {
  icon: LucideIcon
  label: string
  value: string | number
  delay?: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export default function AtsMetricTile({ icon: Icon, label, value, delay = 0 }: AtsMetricTileProps) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      className="group flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/40 hover:bg-zinc-800/50 hover:border-zinc-700/60 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-zinc-600/50 transition-all duration-300">
        <Icon size={15} className="text-zinc-400 group-hover:text-white transition-colors duration-300" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-white tabular-nums">{value}</p>
      </div>
    </motion.div>
  )
}
