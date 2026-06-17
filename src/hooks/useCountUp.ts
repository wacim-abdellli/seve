import { useState, useEffect } from 'react'

export function useCountUp(end: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    let raf: number
    const tick = (now: number) => {
      if (start === null) start = now
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) * (1 - p)
      setValue(Math.round(eased * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, duration])
  return value
}
