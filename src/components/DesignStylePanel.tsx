import { useState, type ReactNode } from 'react'
import type { ResumeStylePreferences } from '../types/resume'
import { ChevronDown, Type, AlignLeft, Palette, Eye } from 'lucide-react'
import { themeColors } from './ResumePreview'

function AccordionSection({ title, icon, defaultOpen = false, children }: { title: string; icon: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-zinc-950/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-zinc-500">{icon}</span>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400 font-display">{title}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  )
}

interface Props {
  stylePrefs: ResumeStylePreferences
  updateStylePrefs: (updater: (prev: ResumeStylePreferences) => ResumeStylePreferences) => void
  themeColor: string
  setThemeColor: (color: string) => void
}

const FONT_OPTIONS = [
  { value: '', label: 'Template Default' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Outfit', label: 'Outfit' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Manrope', label: 'Manrope' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'EB Garamond', label: 'EB Garamond' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
]

function StepperControl({ label, value, onChange, min, max, step = 1, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-zinc-400">{label}</span>
        <span className="text-[11px] font-mono font-bold text-zinc-300">{value}{unit || ''}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(1))))}
          className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center text-xs font-bold cursor-pointer"
        >−</button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 appearance-none bg-zinc-800 rounded-full cursor-pointer accent-rose-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:shadow-md"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, Number((value + step).toFixed(1))))}
          className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center text-xs font-bold cursor-pointer"
        >+</button>
      </div>
    </div>
  )
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-zinc-400">{label}</span>
      <label className="flex items-center gap-2 cursor-pointer group">
        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">{value}</span>
        <span
          className="w-6 h-6 rounded-lg border border-zinc-700 group-hover:border-zinc-500 transition-colors relative overflow-hidden flex-shrink-0"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </span>
      </label>
    </div>
  )
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-bold text-zinc-400 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded-lg bg-zinc-900 border border-zinc-800 px-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 cursor-pointer appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ToggleControl({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
          value ? 'bg-rose-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <div>
        <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">{label}</span>
        {description && <p className="text-[10px] text-zinc-500 mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

export default function DesignStylePanel({ stylePrefs, updateStylePrefs, themeColor, setThemeColor }: Props) {
  const update = (field: keyof ResumeStylePreferences, value: unknown) => {
    updateStylePrefs((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-3 pt-4 border-t border-zinc-800/40">
      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-450 block select-none font-display px-1 pb-1">Typography & Design</span>

      {/* Typography */}
      <AccordionSection title="Typography" icon={<Type size={14} />} defaultOpen>
        <SelectControl
          label="Heading Font"
          value={stylePrefs.headingFont}
          options={FONT_OPTIONS}
          onChange={(v) => update('headingFont', v)}
        />
        <SelectControl
          label="Body Font"
          value={stylePrefs.bodyFont}
          options={FONT_OPTIONS}
          onChange={(v) => update('bodyFont', v)}
        />
        <StepperControl label="Line Height" value={stylePrefs.lineHeight} onChange={(v) => update('lineHeight', v)} min={1} max={2} step={0.05} />
        <SelectControl
          label="Letter Spacing"
          value={stylePrefs.letterSpacing}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: '0.02em', label: 'Wide' },
            { value: '0.05em', label: 'Extra Wide' },
            { value: '-0.01em', label: 'Tight' },
          ]}
          onChange={(v) => update('letterSpacing', v)}
        />
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-zinc-400 block">Heading Case</span>
          <div className="flex gap-1.5">
            {(['uppercase', 'capitalize', 'normal'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update('headingCase', c)}
                className={`flex-1 h-7 text-[10px] font-black rounded-lg transition-colors cursor-pointer border ${
                  stylePrefs.headingCase === c
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {c === 'uppercase' ? 'AA' : c === 'capitalize' ? 'Aa' : 'aa'}
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* Spacing */}
      <AccordionSection title="Spacing" icon={<AlignLeft size={14} />} defaultOpen={false}>
        <StepperControl label="Page Padding" value={stylePrefs.pagePadding} onChange={(v) => update('pagePadding', v)} min={8} max={30} unit="mm" />
        <StepperControl label="Section Spacing" value={stylePrefs.sectionSpacing} onChange={(v) => update('sectionSpacing', v)} min={4} max={32} unit="px" />
        <StepperControl label="Item Spacing" value={stylePrefs.itemSpacing} onChange={(v) => update('itemSpacing', v)} min={2} max={20} unit="px" />
        <StepperControl label="Bullet Indent" value={stylePrefs.bulletIndent} onChange={(v) => update('bulletIndent', v)} min={0} max={40} unit="px" />
      </AccordionSection>

      {/* Colors & Dividers */}
      <AccordionSection title="Colors & Dividers" icon={<Palette size={14} />} defaultOpen={false}>
        <div className="space-y-2 pb-2 border-b border-zinc-800/40">
          <span className="text-[11px] font-bold text-zinc-400 block">Theme Accent</span>
          <div className="flex flex-wrap gap-2">
            {themeColors.map((color) => {
              const isSelected = themeColor === color.value
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setThemeColor(color.value)}
                  style={{ backgroundColor: color.value }}
                  className={`w-6 h-6 rounded-full transition-all duration-150 relative cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 ${
                    isSelected ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-zinc-950 shadow-lg' : 'border border-white/5'
                  }`}
                  title={color.label}
                />
              )
            })}
            <label
              className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 cursor-pointer flex items-center justify-center hover:scale-110 hover:border-zinc-700 transition-all duration-150 relative overflow-hidden"
              title="Custom color"
              style={!themeColors.find(c => c.value === themeColor) ? { 
                backgroundColor: themeColor,
                border: 'none',
                boxShadow: '0 0 0 2px #f43f5e'
              } : undefined}
            >
              <span className="text-xs font-black text-zinc-400 leading-none pointer-events-none select-none">+</span>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Theme accent color"
              />
            </label>
          </div>
        </div>

        <ColorControl label="Body Text" value={stylePrefs.bodyTextColor} onChange={(v) => update('bodyTextColor', v)} />
        <ColorControl label="Headings" value={stylePrefs.headingColor} onChange={(v) => update('headingColor', v)} />
        <div className="space-y-1">
          <ColorControl label="Divider Color" value={stylePrefs.dividerColor === 'theme' ? themeColor : (stylePrefs.dividerColor || themeColor)} onChange={(v) => update('dividerColor', v)} />
          {stylePrefs.dividerColor !== 'theme' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => update('dividerColor', 'theme')}
                className="text-[9px] font-bold text-rose-450 hover:text-rose-350 underline cursor-pointer"
              >
                Match Theme Accent
              </button>
            </div>
          )}
        </div>
        <SelectControl
          label="Divider Style"
          value={stylePrefs.dividerStyle}
          options={[
            { value: 'none', label: 'None' },
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ]}
          onChange={(v) => update('dividerStyle', v as ResumeStylePreferences['dividerStyle'])}
        />
        {stylePrefs.dividerStyle !== 'none' && (
          <StepperControl label="Divider Width" value={stylePrefs.dividerWidth} onChange={(v) => update('dividerWidth', v)} min={0.5} max={4} step={0.5} unit="px" />
        )}
        <SelectControl
          label="Section Styling"
          value={stylePrefs.sectionCutStyle || 'none'}
          options={[
            { value: 'none', label: 'None' },
            { value: 'bottom-line', label: 'Underline Headers' },
            { value: 'left-accent', label: 'Left Accent Line' },
            { value: 'card', label: 'Card Outline' },
            { value: 'stripe', label: 'Alternating Shading' },
          ]}
          onChange={(v) => update('sectionCutStyle', v as ResumeStylePreferences['sectionCutStyle'])}
        />
        {(stylePrefs.sectionCutStyle === 'card' || stylePrefs.sectionCutStyle === 'stripe') && (
          <ColorControl label="Section Background" value={stylePrefs.sectionBgColor || '#f8fafc'} onChange={(v) => update('sectionBgColor', v)} />
        )}
        {stylePrefs.sectionCutStyle === 'card' && (
          <ColorControl label="Section Border" value={stylePrefs.sectionBorderColor || '#e2e8f0'} onChange={(v) => update('sectionBorderColor', v)} />
        )}
      </AccordionSection>

      {/* Accessibility */}
      <AccordionSection title="Accessibility" icon={<Eye size={14} />} defaultOpen={false}>
        <ToggleControl
          label="High Contrast Print"
          description="Increases contrast for better readability when printed"
          value={stylePrefs.highContrastPrint}
          onChange={(v) => update('highContrastPrint', v)}
        />
        <ToggleControl
          label="ATS-Optimized Font"
          description="Uses highly parseable fonts for applicant tracking systems"
          value={stylePrefs.atsOptimizedFont}
          onChange={(v) => update('atsOptimizedFont', v)}
        />
      </AccordionSection>
    </div>
  )
}
