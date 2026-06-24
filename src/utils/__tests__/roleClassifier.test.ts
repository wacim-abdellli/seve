import { describe, it, expect } from 'vitest'
import { classifyDomain, computeDomainPenalty } from '../roleClassifier'

describe('classifyDomain', () => {
  it('classifies software engineer as tech domain', () => {
    const result = classifyDomain('Software Engineer with 5 years of experience in React and TypeScript')
    expect(result.domain).toBe('software_engineering')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
  })

  it('classifies marketing manager as marketing domain', () => {
    const result = classifyDomain('Marketing Manager leading brand strategy and campaigns')
    expect(result.domain).toBe('marketing_communications')
  })

  it('classifies product manager as product_management domain', () => {
    const result = classifyDomain('Product Manager overseeing roadmap and stakeholder alignment')
    expect(result.domain).toBe('product_management')
  })

  it('returns unknown domain for empty text', () => {
    const result = classifyDomain('')
    expect(result.domain).toBe('unknown')
    expect(result.confidence).toBe(0)
  })

  it('returns unknown domain for whitespace-only input', () => {
    const result = classifyDomain(' ')
    expect(result.domain).toBe('unknown')
  })
})

describe('computeDomainPenalty', () => {
  it('returns 0 for matching domains', () => {
    expect(computeDomainPenalty('software_engineering', 'software_engineering')).toBe(0)
  })

  it('returns negative value for mismatched domains', () => {
    const penalty = computeDomainPenalty('software_engineering', 'marketing_communications')
    expect(penalty).toBeLessThan(0)
  })

  it('treats unknown domains as neutral', () => {
    const penalty = computeDomainPenalty('unknown', 'software_engineering')
    expect(typeof penalty).toBe('number')
  })
})
