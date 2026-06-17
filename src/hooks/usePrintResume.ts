import { useState, useCallback } from 'react'
import type { ResumeData } from '../types/resume'

export function usePrintResume() {
  const [activeWarnings, setActiveWarnings] = useState<string[] | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  const triggerNativePrint = useCallback(() => setTimeout(() => window.print(), 300), [])

  const handlePrint = useCallback((resumeData: ResumeData, pageCount: number) => {
    const newWarnings: string[] = []
    const experience = resumeData.experience || []
    for (const exp of experience) {
      const bullets = exp.bullets || []
      const seen = new Set<string>()
      for (const b of bullets) { const t = b.trim(); if (t && seen.has(t)) { newWarnings.push("Work Experience contains duplicate bullet points."); break }; seen.add(t) }
    }
    if (newWarnings.length === 0 && pageCount > 1) newWarnings.push(`Resume is currently ${pageCount} pages. A 1-page layout is recommended.`)
    const summary = resumeData.summary || ''
    if (newWarnings.length === 0 && summary.trim() && summary.trim().length < 50) newWarnings.push("Professional summary is very short (under 50 characters).")
    const education = resumeData.education || []
    for (const edu of education) {
      if ((!!edu.school?.trim() && !edu.degree?.trim()) || (!edu.school?.trim() && !!edu.degree?.trim())) { newWarnings.push("Education history has incomplete entries (missing School or Degree)."); break }
    }
    if (newWarnings.length > 0) { setActiveWarnings(newWarnings); return }
    setShowPrintModal(true)
  }, [])

  const dismissWarnings = useCallback(() => setActiveWarnings(null), [])
  const exportAnyway = useCallback(() => { setActiveWarnings(null); setShowPrintModal(true) }, [])
  const dismissPrintModal = useCallback(() => setShowPrintModal(false), [])
  const confirmPrint = useCallback(() => { setShowPrintModal(false); triggerNativePrint() }, [triggerNativePrint])

  return {
    activeWarnings,
    showPrintModal,
    handlePrint,
    triggerNativePrint,
    dismissWarnings,
    exportAnyway,
    dismissPrintModal,
    confirmPrint,
  }
}
