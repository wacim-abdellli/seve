import { useState } from 'react'
import type { ResumeData, Template } from '../types/resume'

interface SettingsModalProps {
  apiKey: string
  onUpdateApiKey: (key: string) => void
  selectedTemplate: Template
  onUpdateTemplate: (template: Template) => void
  resumeData: ResumeData
  onImportResume: (data: ResumeData) => void
  onClose: () => void
}

export default function SettingsModal({
  apiKey,
  onUpdateApiKey,
  selectedTemplate,
  onUpdateTemplate,
  resumeData,
  onImportResume,
  onClose,
}: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  const [importJson, setImportJson] = useState('')

  const handleSave = () => {
    onUpdateApiKey(tempKey)
    alert('Settings saved successfully!')
    onClose()
  }

  const handleExport = () => {
    const json = JSON.stringify(resumeData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume_${resumeData.contact.fullName.replace(/\s+/g, '_') || 'data'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson)
      if (parsed && typeof parsed === 'object' && parsed.contact) {
        onImportResume(parsed)
        alert('Resume data imported successfully!')
        setImportJson('')
      } else {
        alert('Invalid format. JSON must contain at least a contact object.')
      }
    } catch (e) {
      alert('Error parsing JSON. Please ensure it is valid JSON syntax.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-white">Settings & Data</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* API Settings */}
        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Claude/Gemini API Key
              </label>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Get Free Gemini Key
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Paste your API key here..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-3 pr-16 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1.5 text-xs text-indigo-400 font-semibold px-2 py-0.5 hover:text-indigo-300"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Saved in browser local storage. Leave empty to run in **100% Free / $0 Cost Heuristics mode** (uses browser-based templates and word-mapping algorithms).
            </p>
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 block">
              Default Template Preference
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => onUpdateTemplate(e.target.value as Template)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2"
            >
              <option value="classic">Classic (Traditional serif)</option>
              <option value="modern">Modern (Tech sans-serif + accents)</option>
              <option value="executive">Executive (Senior bold serif)</option>
            </select>
          </div>
        </div>

        {/* Data Import/Export */}
        <div className="space-y-3 pt-3 border-t border-slate-700">
          <h4 className="text-xs font-bold uppercase text-slate-300">Backup & Restore</h4>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-lg py-2 text-xs font-semibold"
            >
              📤 Export Resume JSON
            </button>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Import JSON Data</label>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste backup resume JSON content here..."
              className="w-full h-20 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono"
            />
            <button
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg py-1.5 text-xs font-bold transition-all"
            >
              📥 Import & Overwrite
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
