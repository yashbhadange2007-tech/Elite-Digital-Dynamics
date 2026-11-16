import { site, waLink } from '@/lib/site';
import type { Enquiry } from './validation';

/**
 * The two ways an enquiry leaves the page.
 * - No key (ships now): a pre-filled WhatsApp message or email, opened by the visitor's own app.
 * - Key (later): Web3Forms, ARCHITECTURE.md section 6.
 */

export const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
export const SUBMIT_TIMEOUT_MS = 12_000;
const MAILTO_BODY_MAX = 1800;

const LABELS: [keyof Enquiry, string][] = [
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['business', 'Business'],
  ['service', 'Service'],
  ['message', 'Message'],
];

/** Every filled field, one per line, under a greeting. */
export function enquiryText(data: Enquiry): string {
  const lines = LABELS.filter(([key]) => data[key]).map(([key, label]) => `${label}: ${data[key]}`);
  return [`Hello ${site.name}, I would like to talk about a project.`, '', ...lines].join('\n');
}

export function whatsappUrl(data: Enquiry): string {
  return waLink(enquiryText(data));
}

export function mailtoUrl(data: Enquiry): string {
  let body = enquiryText(data);
  if (body.length > MAILTO_BODY_MAX) body = `${body.slice(0, MAILTO_BODY_MAX - 3)}...`;
  const subject = `Project enquiry from ${data.name}`;
  return `${site.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;
}

/**
 * Opens WhatsApp in a new tab, or the mail app in place. Call it synchronously inside the click
 * handler so the browser counts it as a user action. Everything goes through `window.open`, the
 * one seam tests replace to record the URL instead of leaving the page.
 */
export function openExternal(url: string): void {
  if (url.startsWith('mailto:')) window.open(url, '_self');
  else window.open(url, '_blank', 'noopener,noreferrer');
}

/** True only when Web3Forms answers OK with `success: true` within the timeout. */
export async function sendToWeb3Forms(
  accessKey: string,
  data: Enquiry,
  timeoutMs = SUBMIT_TIMEOUT_MS,
): Promise<boolean> {
  try {
    const response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `New enquiry from ${data.name}`,
        from_name: `${site.name} website`,
        ...data,
        botcheck: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null && (body as { success?: unknown }).success === true;
  } catch {
    return false;
  }
}
