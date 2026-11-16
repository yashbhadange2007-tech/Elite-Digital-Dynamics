import { describe, expect, it } from 'vitest';
import { mailtoUrl, whatsappUrl } from './submit';
import { ERRORS, normalisePhone, validateEnquiry, type Enquiry } from './validation';

const empty: Enquiry = { name: '', phone: '', email: '', business: '', service: '', message: '' };

describe('normalisePhone', () => {
  it.each([
    '9226046693',
    '92260 46693',
    '+91 92260 46693',
    '+91-92260-46693',
    '0091 9226046693',
    '919226046693',
    '09226046693',
    '(922) 604.6693',
  ])('accepts %s as +919226046693', (raw) => {
    expect(normalisePhone(raw)).toBe('+919226046693');
  });

  it('accepts an 11-digit landline with a leading 0', () => {
    expect(normalisePhone('020 2553 1234')).toBe('+912025531234');
  });

  it.each(['12345', '922604669', '5226046693', '9999999999', '98765abcde', '', '   ', '+44 7911 123456', '92260466931'])(
    'rejects %j',
    (raw) => {
      expect(normalisePhone(raw)).toBeNull();
    },
  );
});

describe('validateEnquiry', () => {
  it('requires name and phone, and nothing else', () => {
    expect(validateEnquiry(empty).errors).toEqual({ name: ERRORS.name, phone: ERRORS.phone });
  });

  it('treats a blank name as missing', () => {
    expect(validateEnquiry({ ...empty, name: '   ', phone: '9226046693' }).errors).toEqual({ name: ERRORS.name });
  });

  it('checks the email only when one is given', () => {
    const base = { ...empty, name: 'Asha', phone: '9226046693' };
    expect(validateEnquiry(base).errors).toEqual({});
    expect(validateEnquiry({ ...base, email: 'asha@example.in' }).errors).toEqual({});
    for (const bad of ['asha', 'asha@', 'asha@example', 'a sha@example.in', '@example.in']) {
      expect(validateEnquiry({ ...base, email: bad }).errors).toEqual({ email: ERRORS.email });
    }
  });

  it('allows a message up to 2000 characters', () => {
    const base = { ...empty, name: 'Asha', phone: '9226046693' };
    expect(validateEnquiry({ ...base, message: 'a'.repeat(2000) }).errors).toEqual({});
    expect(validateEnquiry({ ...base, message: 'a'.repeat(2001) }).errors).toEqual({ message: ERRORS.message });
  });

  it('returns trimmed data with the phone as +91XXXXXXXXXX', () => {
    const { data } = validateEnquiry({ ...empty, name: ' Asha ', phone: '092260 46693', email: ' a@b.in ' });
    expect(data).toEqual({ ...empty, name: 'Asha', phone: '+919226046693', email: 'a@b.in' });
  });
});

describe('fallback links', () => {
  const filled: Enquiry = {
    name: 'Asha Patil',
    phone: '+919226046693',
    email: 'asha@example.in',
    business: 'Asha Salon & Spa',
    service: 'WhatsApp Automation',
    message: 'Two branches, need booking reminders.',
  };

  it('WhatsApp goes to the agency number with every filled field', () => {
    const url = new URL(whatsappUrl(filled));
    expect(url.origin + url.pathname).toBe('https://wa.me/919226046693');
    const text = url.searchParams.get('text') ?? '';
    for (const value of Object.values(filled)) expect(text).toContain(value);
  });

  it('leaves out empty fields', () => {
    const text = new URL(whatsappUrl({ ...empty, name: 'Asha', phone: '+919226046693' })).searchParams.get('text');
    expect(text).not.toContain('Email:');
    expect(text).not.toContain('Business:');
  });

  it('email goes to the agency address with subject and every field, body at most 1800 characters', () => {
    const url = mailtoUrl(filled);
    expect(url.startsWith('mailto:elitedigitaldynamics.26@gmail.com?')).toBe(true);
    const query = new URLSearchParams(url.split('?')[1]);
    expect(query.get('subject')).toBe('Project enquiry from Asha Patil');
    for (const value of Object.values(filled)) expect(query.get('body')).toContain(value);

    const long = new URLSearchParams(mailtoUrl({ ...filled, message: 'x'.repeat(2000) }).split('?')[1]);
    expect((long.get('body') ?? '').length).toBeLessThanOrEqual(1800 + 10); // + the CRLF line breaks
  });
});
