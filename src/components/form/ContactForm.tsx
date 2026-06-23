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

    if (field === 'email') {
      if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailError('Invalid email format (e.g. name@domain.com)')
      } else {
        setEmailError('')
      }
    }

    if (field === 'phone') {
      if (value.trim() && !/^[\d\s\-+()]+$/.test(value)) {
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
    <div className="flex flex-col gap-4">
      {/* Full Name */}
      <div className="space-y-1">
        <label htmlFor="contact-fullname" className="text-[11px] text-zinc-500">
          Full Name
        </label>
        <input
          id="contact-fullname"
          type="text"
          value={contact.fullName}
          onChange={(e) => handleFieldChange('fullName', e.target.value)}
          className="drawer-input"
          placeholder="e.g. Jane Doe"
        />
      </div>

      {/* Location */}
      <div className="space-y-1">
        <label htmlFor="contact-location" className="text-[11px] text-zinc-500">
          Location
        </label>
        <input
          id="contact-location"
          type="text"
          value={contact.location}
          onChange={(e) => handleFieldChange('location', e.target.value)}
          className="drawer-input"
          placeholder="e.g. New York, NY"
        />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="contact-email" className="text-[11px] text-zinc-500">
          Email Address
        </label>
        <input
          id="contact-email"
          type="email"
          value={contact.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          className="drawer-input"
          placeholder="e.g. jane.doe@email.com"
        />
        {emailError && <span className="text-[10px] font-bold text-rose-500 mt-0.5 block">{emailError}</span>}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <label htmlFor="contact-phone" className="text-[11px] text-zinc-500">
          Phone Number
        </label>
        <input
          id="contact-phone"
          type="text"
          value={contact.phone}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          className="drawer-input"
          placeholder="e.g. +1 (555) 019-2834"
        />
        {phoneError && <span className="text-[10px] font-bold text-rose-500 mt-0.5 block">{phoneError}</span>}
      </div>

      {/* LinkedIn */}
      <div className="space-y-1">
        <label htmlFor="contact-linkedin" className="text-[11px] text-zinc-500">
          LinkedIn URL
        </label>
        <input
          id="contact-linkedin"
          type="text"
          value={contact.linkedin}
          onChange={(e) => handleFieldChange('linkedin', e.target.value)}
          className="drawer-input"
          placeholder="e.g. linkedin.com/in/janedoe"
        />
        {linkedinError && <span className="text-[10px] font-bold text-rose-500 mt-0.5 block">{linkedinError}</span>}
      </div>

      {/* Website */}
      <div className="space-y-1">
        <label htmlFor="contact-website" className="text-[11px] text-zinc-500">
          Personal Website (optional)
        </label>
        <input
          id="contact-website"
          type="text"
          value={contact.website || ''}
          onChange={(e) => handleFieldChange('website', e.target.value)}
          className="drawer-input"
          placeholder="e.g. janedoe.dev"
        />
      </div>
    </div>
  )
}
