import { useState } from 'react'
import type { ContactInfo } from '../../types/resume'

interface ContactFormProps {
  contact: ContactInfo
  onChange: (updated: ContactInfo) => void
}

export default function ContactForm({ contact, onChange }: ContactFormProps) {
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [linkedinError, setLinkedinError] = useState('')

  const handleFieldChange = (field: keyof ContactInfo, value: string) => {
    const updated = { ...contact, [field]: value }
    onChange(updated)

    // Real-time validations
    if (field === 'email') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailError('Invalid email format (e.g. name@domain.com)')
      } else {
        setEmailError('')
      }
    }

    if (field === 'phone') {
      // Allow letters/numbers/spaces/dashes/parentheses
      if (value.trim() && !/^[\d\s\-\+\(\)]+$/.test(value)) {
        setPhoneError('Invalid phone number format')
      } else {
        setPhoneError('')
      }
    }

    if (field === 'linkedin') {
      if (value.trim() && !/linkedin\.com/i.test(value)) {
        setLinkedinError('Invalid LinkedIn URL (must contain linkedin.com)')
      } else {
        setLinkedinError('')
      }
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={contact.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Location *
          </label>
          <input
            type="text"
            value={contact.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder="New York, NY"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={contact.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="jane.doe@email.com"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Phone Number *
          </label>
          <input
            type="text"
            value={contact.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="+1 (555) 019-2834"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {phoneError && <p className="text-xs text-red-400 mt-1">{phoneError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            LinkedIn Profile *
          </label>
          <input
            type="text"
            value={contact.linkedin}
            onChange={(e) => handleFieldChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/janedoe"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {linkedinError && <p className="text-xs text-red-400 mt-1">{linkedinError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Personal Website / Portfolio (Optional)
          </label>
          <input
            type="text"
            value={contact.website || ''}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder="janedoe.dev"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  )
}
