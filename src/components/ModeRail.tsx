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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 flex flex-row justify-around items-center px-2 z-50 no-print">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeMode === item.id

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChangeMode(item.id)}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isActive ? 'text-red-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
            <span className="text-[10px] uppercase tracking-wider font-bold">
              {item.label}
            </span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onSettingsClick}
        className="flex flex-col items-center gap-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Settings size={20} className="stroke-[1.5px]" />
        <span className="text-[10px] uppercase tracking-wider font-bold">Settings</span>
      </button>
    </nav>
  )
}
