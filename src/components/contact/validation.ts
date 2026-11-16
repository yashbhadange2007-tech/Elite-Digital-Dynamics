/**
 * Enquiry form rules (ARCHITECTURE.md section 6, messages from SPEC.md "Enquiry and contact").
 * Pure: no DOM, no React, unit-tested in contact.test.ts.
 */

export const MESSAGE_MAX = 2000;

export const ERRORS = {
  name: 'Enter your name.',
  phone: 'Enter a 10-digit Indian mobile number, for example 98765 43210.',
  email: 'That email address does not look right.',
  message: `Keep the message under ${MESSAGE_MAX} characters.`,
} as const;

export type FieldName = 'name' | 'phone' | 'email' | 'business' | 'service' | 'message';
export type Enquiry = Record<FieldName, string>;
export type Errors = Partial<Record<keyof typeof ERRORS, string>>;

/**
 * Indian phone number to `+91XXXXXXXXXX`, or null when it is not one.
 * Strips spaces and `-().`, then a leading `+91`, `0091` or `91` (when 10 digits remain), then
 * the trunk `0` of an 11-digit number. Accepts a mobile (`6` to `9` first) or a `0`-prefixed
 * landline; rejects ten identical digits.
 */
export function normalisePhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (/^0091\d{10}$/.test(digits)) digits = digits.slice(4);
  else if (/^91\d{10}$/.test(digits)) digits = digits.slice(2);

  const landline = /^0[1-9]\d{9}$/.test(digits);
  if (landline) digits = digits.slice(1);

  if (!/^\d{10}$/.test(digits) || /^(\d)\1{9}$/.test(digits)) return null;
  if (!landline && !/^[6-9]/.test(digits)) return null;
  return `+91${digits}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks every field. `data` holds the trimmed values with the phone in `+91` form. */
export function validateEnquiry(raw: Enquiry): { errors: Errors; data: Enquiry } {
  const data = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, value.trim()]),
  ) as Enquiry;
  const errors: Errors = {};

  if (!data.name) errors.name = ERRORS.name;

  const phone = normalisePhone(data.phone);
  if (phone) data.phone = phone;
  else errors.phone = ERRORS.phone;

  if (data.email && !EMAIL.test(data.email)) errors.email = ERRORS.email;
  if (data.message.length > MESSAGE_MAX) errors.message = ERRORS.message;

  return { errors, data };
}
