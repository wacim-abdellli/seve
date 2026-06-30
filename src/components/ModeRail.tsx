import { PenLine, Eye, ShieldCheck, Settings, Sliders } from 'lucide-react'

export interface ModeRailProps {
  activeMode: 'studio' | 'design' | 'preview' | 'analyze'
  onChangeMode: (mode: 'studio' | 'design' | 'preview' | 'analyze') => void
  onSettingsClick: () => void
}

export default function ModeRail({ activeMode, onChangeMode, onSettingsClick }: ModeRailProps) {
  const items = [
    { id: 'studio' as const, label: 'Edit', icon: PenLine },
    { id: 'design' as const, label: 'Design', icon: Sliders },
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'analyze' as const, label: 'ATS', icon: ShieldCheck },
  ]

  return (
    <>
      {/* Mobile: bottom nav bar */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/60 flex flex-row justify-around items-center px-1.5 py-1.5 rounded-2xl z-50 no-print shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeMode === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeMode(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-11 rounded-xl transition-all duration-150 active:scale-95 border ${
                isActive 
                  ? 'font-extrabold' 
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
              style={isActive ? { color: 'var(--accent)', backgroundColor: 'var(--accent-soft)', borderColor: 'rgba(185,28,28,0.2)' } : {}}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
              <span className="text-[9px] uppercase tracking-wider font-bold leading-none mt-0.5">
                {item.label}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-11 rounded-xl text-zinc-400 border border-transparent transition-all duration-150 hover:text-zinc-200 hover:bg-zinc-900/40 active:scale-95"
        >
          <Settings size={18} className="stroke-[1.5px]" />
          <span className="text-[9px] uppercase tracking-wider font-bold leading-none mt-0.5">Settings</span>
        </button>
      </nav>

      {/* Desktop: left vertical rail */}
      <nav className="hidden lg:flex flex-col items-center gap-2 w-16 h-full bg-zinc-950/40 border-r border-zinc-800/80 py-4 no-print flex-shrink-0">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeMode === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeMode(item.id)}
              className={`relative flex flex-col items-center justify-center gap-1.5 w-12 h-12 rounded-xl transition-all duration-150 border ${
                isActive
                  ? 'font-extrabold'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
              style={isActive ? { color: 'var(--accent)', backgroundColor: 'var(--accent-soft)', borderColor: 'rgba(185,28,28,0.2)' } : {}}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 rounded-r bg-[var(--accent)]"
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] uppercase tracking-wider font-bold leading-none text-center">
                {item.label}
              </span>
            </button>
          )
        })}

        <div className="flex-1" />

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex flex-col items-center justify-center gap-1.5 w-12 h-12 rounded-xl text-zinc-550 border border-transparent hover:text-zinc-300 hover:bg-zinc-800/40 transition-all duration-200 active:scale-95"
        >
          <Settings size={18} className="stroke-[1.5px]" />
          <span className="text-[9px] uppercase tracking-wider font-bold leading-none text-center">Settings</span>
        </button>
      </nav>
    </>
  )
}
