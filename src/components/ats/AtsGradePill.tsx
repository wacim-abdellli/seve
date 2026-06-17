import { motion } from 'framer-motion'

interface AtsGradePillProps {
  letter: string
  score: number
}

function getGradeStyles(score: number) {
  if (score >= 90) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
  if (score >= 70) return { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
  if (score >= 50) return { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }
  return { text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
}

export default function AtsGradePill({ letter, score }: AtsGradePillProps) {
  const styles = getGradeStyles(score)
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
      className={`px-2.5 py-0.5 rounded-lg text-[12px] font-black border ${styles.bg} ${styles.text}`}
    >
      {letter}
    </motion.span>
  )
}
