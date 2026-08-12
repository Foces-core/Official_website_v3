import { describe, it, expect } from 'vitest';
import { validateContactForm } from '../../src/utils/validateContactForm.js';

describe('validateContactForm', () => {
  const valid = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Hello',
    message: 'Hi there',
  };

  it('accepts a fully filled, valid form', () => {
    expect(validateContactForm(valid)).toBeNull();
  });

  it('rejects when any required field is blank or whitespace-only', () => {
    expect(validateContactForm({ ...valid, name: '   ' })).toBe('Please fill in all fields.');
    expect(validateContactForm({ ...valid, email: '' })).toBe('Please fill in all fields.');
    expect(validateContactForm({ ...valid, subject: '' })).toBe('Please fill in all fields.');
    expect(validateContactForm({ ...valid, message: '' })).toBe('Please fill in all fields.');
  });

  it('treats an absent field as blank (defensive, never crashes)', () => {
    expect(validateContactForm({ ...valid, message: undefined })).toBe(
      'Please fill in all fields.',
    );
  });

  it('rejects a malformed email', () => {
    expect(validateContactForm({ ...valid, email: 'not-an-email' })).toBe(
      'Please enter a valid email address.',
    );
  });

  it('accepts a valid email surrounded by whitespace', () => {
    expect(validateContactForm({ ...valid, email: '  test@example.com  ' })).toBeNull();
  });

  it('reports missing fields before the email check (first error wins)', () => {
    expect(validateContactForm({ ...valid, name: '', email: 'not-an-email' })).toBe(
      'Please fill in all fields.',
    );
  });
});
