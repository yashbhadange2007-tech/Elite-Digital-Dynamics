/**
 * The five services, in page order, with the exact names from the owner's brief.
 * Used by the services section, the enquiry form select and the structured data.
 */
export const SERVICES = [
  { id: 'website', name: 'Website Development' },
  { id: 'app', name: 'Custom App Development' },
  { id: 'reviews', name: 'Automated Google Review Collection' },
  { id: 'ai-video', name: 'AI Video & Personalised Content' },
  { id: 'whatsapp', name: 'WhatsApp Automation' },
] as const;

export type Service = (typeof SERVICES)[number];
export type ServiceId = Service['id'];

/** The extra option in the enquiry form's service select. */
export const NOT_SURE = 'Not sure yet';
