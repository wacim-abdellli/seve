import { motion } from 'framer-motion'

interface CategoryItem {
  key: string
  label: string
  score: number
  max: number
}

interface AtsCategoryBarsProps {
  categories: CategoryItem[]
  totalScore: number
  totalMax: number
}

const BAR_COLORS = ['bg-rose-500', 'bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-zinc-400']
const BAR_SHADOWS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#a1a1aa']

export default function AtsCategoryBars({ categories, totalScore, totalMax }: AtsCategoryBarsProps) {
  return (
    <div className="pt-6 border-t border-zinc-800/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          Category Breakdown
        </h3>
        <span className="text-[10px] font-bold text-zinc-600 tabular-nums">{totalScore}/{totalMax}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {categories.map((cat, idx) => {
          const pct = Math.round((cat.score / cat.max) * 100)
          return (
            <div key={cat.key} className="flex items-center gap-3 group">
              <span className="text-[10px] font-medium text-zinc-500 w-24 truncate shrink-0 group-hover:text-zinc-300 transition-colors">
                {cat.label}
              </span>
              <div className="flex-1 h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + idx * 0.04, ease: 'easeOut' }}
                  className={`h-full rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                  style={{ boxShadow: pct > 0 ? `0 0 6px ${BAR_SHADOWS[idx % BAR_SHADOWS.length]}40` : 'none' }}
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-500 tabular-nums w-8 text-right shrink-0">
                {cat.score}<span className="text-zinc-700">/{cat.max}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
