import { useEffect, useRef, useState } from 'react'
import { usePageViews } from '@/hooks/usePageViews'
import { Users } from 'lucide-react'

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const [flash, setFlash] = useState(false)
  const raf = useRef<number>(0)
  const prevValue = useRef(value)
  const displayRef = useRef(display)
  useEffect(() => { displayRef.current = display })

  useEffect(() => {
    if (value === prevValue.current && displayRef.current === value) return
    prevValue.current = value

    setFlash(true)
    setTimeout(() => setFlash(false), 600)

    const start = performance.now()
    const duration = 1200
    const from = displayRef.current
    const to = value

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(from + (to - from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value])

  return (
    <span className={flash ? 'text-emerald-400 transition-colors duration-300' : 'transition-colors duration-300'}>
      {display.toLocaleString()}{suffix}
    </span>
  )
}

export function PageViewsWidget() {
  const { totalViews, monthlyViews } = usePageViews()

  if (totalViews === null && monthlyViews === null) return null

  return (
    <div className="animate-slide-up mt-6 w-full max-w-xs">
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-800/30 flex items-center justify-center">
            <Users size={14} className="text-red-400" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex items-baseline gap-3">
          {monthlyViews !== null && (
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-white tabular-nums">
                <AnimatedCounter value={monthlyViews} />
              </span>
              <span className="text-[10px] text-muted-foreground/70 font-medium">this month</span>
            </div>
          )}
          <span className="text-muted-foreground/30">·</span>
          {totalViews !== null && (
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-white tabular-nums">
                <AnimatedCounter value={totalViews} />
              </span>
              <span className="text-[10px] text-muted-foreground/70 font-medium">total</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
