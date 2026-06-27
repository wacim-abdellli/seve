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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 flex flex-row justify-around items-center px-1 z-50 no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeMode === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeMode(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] h-14 px-3 rounded-2xl transition-all active:scale-95 ${
                isActive ? 'font-medium' : 'text-zinc-500'
              }`}
              style={isActive ? { color: 'var(--accent)', background: 'var(--accent-soft)' } : {}}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
              <span className="text-[10px] uppercase tracking-wider font-bold leading-none">
                {item.label}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] h-14 px-3 rounded-2xl text-zinc-500 transition-all active:scale-95"
        >
          <Settings size={20} className="stroke-[1.5px]" />
          <span className="text-[10px] uppercase tracking-wider font-bold leading-none">Settings</span>
        </button>
      </nav>

      {/* Desktop: left vertical rail */}
      <nav className="hidden lg:flex flex-col items-center gap-1 w-16 h-full bg-zinc-950/40 border-r border-zinc-800 py-3 no-print flex-shrink-0">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeMode === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeMode(item.id)}
              className={`relative flex flex-col items-center gap-1 py-3 px-2 w-14 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--accent)]"
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[9px] uppercase tracking-wider font-bold leading-tight text-center">
                {item.label}
              </span>
            </button>
          )
        })}

        <div className="flex-1" />

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex flex-col items-center gap-1 py-3 px-2 w-14 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors"
        >
          <Settings size={18} className="stroke-[1.5px]" />
          <span className="text-[9px] uppercase tracking-wider font-bold leading-tight text-center">Settings</span>
        </button>
      </nav>
    </>
  )
}
