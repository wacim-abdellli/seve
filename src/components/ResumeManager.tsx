import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { ResumeProfile } from '../types/resume'
import { Copy, Edit2, Trash2, Check, Plus, FolderOpen, Calendar, X, AlertTriangle } from 'lucide-react'
import { calculateCompletion } from '../utils/completionHelper'

interface ResumeManagerProps {
  resumes: Record<string, ResumeProfile>
  selectedResumeId: string
  onSelect: (id: string) => void
  onCreate: (title: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function ResumeManager({
  resumes,
  selectedResumeId,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
  onClose,
}: ResumeManagerProps) {
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    onCreate(newTitle.trim())
    setNewTitle('')
  }

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const saveRename = (id: string) => {
    if (!editTitle.trim()) return
    onRename(id, editTitle.trim())
    setEditingId(null)
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      {/* Backdrop close area */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.25 }}
        className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-[640px] max-w-full shadow-2xl flex flex-col max-h-[90vh] z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">Manage Resumes</h3>
              <p className="text-[11px] text-zinc-400">Switch, duplicate, rename, or create resume versions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-zinc-800/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create new resume form */}
        <form onSubmit={handleCreate} className="flex gap-2 mt-4 pb-4 border-b border-zinc-800/40">
          <input
            type="text"
            placeholder="e.g. Software Engineer (React), Product Manager..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 transition-colors"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-lg shadow-rose-500/10 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New Version
          </button>
          
        </form>

        {/* Resumes List */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 custom-scrollbar">
          {Object.values(resumes).map((profile) => {
            const isSelected = profile.id === selectedResumeId
            const isEditing = profile.id === editingId
            const completion = calculateCompletion(profile.resumeData)
            const dateStr = new Date(profile.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <div
                key={profile.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                    : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700/60'
                }`}
              >
                {/* Left side: title and details */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2 max-w-full">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500/60 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(profile.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveRename(profile.id)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded hover:bg-zinc-800 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-white' : 'text-zinc-200'
                        }`}
                      >
                        {profile.title}
                      </h4>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          Active
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata line */}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-650" />
                      {dateStr}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{profile.selectedTemplate} style</span>
                    <span>•</span>
                    <span className={completion === 100 ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                      {completion}% Complete
                    </span>
                  </div>
                </div>

                {/* Right side Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isSelected && !isEditing && (
                    <button
                      type="button"
                      onClick={() => onSelect(profile.id)}
                      className="h-8 px-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-[10px] transition-colors cursor-pointer"
                    >
                      Activate
                    </button>
                  )}
                  
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startRename(profile.id, profile.title)}
                      title="Rename"
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 border border-zinc-800/40 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDuplicate(profile.id)}
                    title="Duplicate"
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 border border-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {Object.keys(resumes).length > 1 && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(profile.id)}
                      title="Delete"
                      className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/5 border border-zinc-800/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirmation Modal for deletion */}
        <AnimatePresence>
          {confirmDeleteId && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-center items-center text-center z-20">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-3">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h4 className="text-white font-extrabold text-sm uppercase">Delete Resume Version?</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-[340px]">
                Are you sure you want to delete <strong className="text-zinc-200">"{resumes[confirmDeleteId]?.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-5 w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 h-9 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(confirmDeleteId)
                    setConfirmDeleteId(null)
                  }}
                  className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/10 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
