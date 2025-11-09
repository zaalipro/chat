import { describe, it, expect } from 'vitest'
import { sanitizeInput, sanitizeMessage, sanitizeAuthor } from '../sanitize'

describe('sanitizeInput', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('')
    expect(sanitizeInput(undefined)).toBe('')
    expect(sanitizeInput(123)).toBe('')
    expect(sanitizeInput({})).toBe('')
  })

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world')
  })

  it('should remove HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeInput('<b>bold</b>')).toBe('bold')
    expect(sanitizeInput('<a href="javascript:alert(1)">link</a>')).toBe('link')
  })

  it('should remove HTML attributes', () => {
    expect(sanitizeInput('<div onclick="alert(1)">content</div>')).toBe('content')
  })

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('')
    expect(sanitizeInput('   ')).toBe('')
  })
})

describe('sanitizeMessage', () => {
  it('should return empty string for invalid input', () => {
    expect(sanitizeMessage(null)).toBe('')
    expect(sanitizeMessage(undefined)).toBe('')
    expect(sanitizeMessage(123)).toBe('')
  })

  it('should sanitize message content', () => {
    expect(sanitizeMessage('<script>alert("xss")</script>hello')).toBe('hello')
    expect(sanitizeMessage('Hello <b>world</b>!')).toBe('Hello world!')
  })

  it('should throw error for messages that are too long', () => {
    const longMessage = 'a'.repeat(5001)
    expect(() => sanitizeMessage(longMessage)).toThrow('Message too long')
  })

  it('should accept messages within length limit', () => {
    const validMessage = 'a'.repeat(5000)
    expect(sanitizeMessage(validMessage)).toBe(validMessage)
  })
})

describe('sanitizeAuthor', () => {
  it('should return "Anonymous" for invalid input', () => {
    expect(sanitizeAuthor(null)).toBe('Anonymous')
    expect(sanitizeAuthor(undefined)).toBe('Anonymous')
    expect(sanitizeAuthor(123)).toBe('Anonymous')
  })

  it('should sanitize author name', () => {
    expect(sanitizeAuthor('<script>alert("xss")</script>John')).toBe('John')
    expect(sanitizeAuthor('John <b>Doe</b>')).toBe('John Doe')
  })

  it('should handle angle brackets safely', () => {
    expect(sanitizeAuthor('John <Doe>')).toBe('John')
    expect(sanitizeAuthor('<admin>')).toBe('Anonymous')
    // The important thing is that the angle brackets are handled safely
    const result = sanitizeAuthor('User <123>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).toBe('User')
  })

  it('should return "Anonymous" for empty after sanitization', () => {
    expect(sanitizeAuthor('<script></script>')).toBe('Anonymous')
    expect(sanitizeAuthor('   ')).toBe('Anonymous')
    expect(sanitizeAuthor('<admin>')).toBe('Anonymous')
  })

  it('should truncate long author names', () => {
    const longName = 'a'.repeat(51)
    expect(sanitizeAuthor(longName)).toBe('a'.repeat(50))
  })

  it('should accept valid author names', () => {
    expect(sanitizeAuthor('John Doe')).toBe('John Doe')
    expect(sanitizeAuthor('Alice')).toBe('Alice')
    expect(sanitizeAuthor('User123')).toBe('User123')
  })

  it('should prevent XSS attacks', () => {
    const xssAttempts = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '"><script>alert(1)</script>'
    ]

    xssAttempts.forEach(attempt => {
      const result = sanitizeAuthor(attempt)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('onerror=')
      expect(result).not.toContain('onload=')
    })
  })
})