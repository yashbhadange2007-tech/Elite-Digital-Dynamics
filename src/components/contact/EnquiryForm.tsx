'use client';

import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import { Warning } from '@phosphor-icons/react/dist/ssr/Warning';
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import Link from 'next/link';
import { useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { NOT_SURE, SERVICES } from '@/lib/services';
import { site } from '@/lib/site';
import { mailtoUrl, openExternal, sendToWeb3Forms, whatsappUrl } from './submit';
import { MESSAGE_MAX, validateEnquiry, type Enquiry, type Errors, type FieldName } from './validation';

type Status = 'idle' | 'pending' | 'success' | 'failed' | 'opened-whatsapp' | 'opened-email';
type Action = 'whatsapp' | 'email' | 'web3forms';

const FIELDS: FieldName[] = ['name', 'phone', 'email', 'business', 'service', 'message'];
const LABELS: Record<keyof Errors, string> = { name: 'Your name', phone: 'Phone number', email: 'Email', message: 'Message' };
const id = (field: FieldName) => `enquiry-${field}`;

const control =
  'block w-full rounded-card border border-(--field-border) bg-(--field-fill) px-4 text-body text-text ' +
  'transition-colors duration-(--dur-1) ease-out hover:border-white/28 focus:border-salmon aria-invalid:border-ember-300';

export type EnquiryFormProps = {
  /** Web3Forms access key. Empty or missing: the form opens WhatsApp or the email app instead. */
  accessKey?: string;
  /** Web3Forms timeout in ms (12 s). Only the preview route shortens it, for tests. */
  timeoutMs?: number;
};

/** The enquiry form (ARCHITECTURE.md section 6). Words from SPEC.md "Enquiry and contact". */
export function EnquiryForm({ accessKey, timeoutMs }: EnquiryFormProps) {
  const keyMode = Boolean(accessKey?.trim());
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [sentName, setSentName] = useState('');
  const [fellBack, setFellBack] = useState(false);

  const read = (form: HTMLFormElement) => {
    const values = new FormData(form);
    return Object.fromEntries(FIELDS.map((field) => [field, String(values.get(field) ?? '')])) as Enquiry;
  };

  const focusField = (field: FieldName) => {
    formRef.current?.querySelector<HTMLElement>(`#${id(field)}`)?.focus();
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'pending') return;
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = (submitter?.value || (keyMode ? 'web3forms' : 'whatsapp')) as Action;

    const { errors: found, data } = validateEnquiry(read(form));
    const invalid = FIELDS.filter((field) => field in found);
    flushSync(() => {
      setAttempted(true);
      setErrors(found);
      if (invalid.length) setStatus((now) => (now === 'failed' ? now : 'idle'));
    });
    if (invalid.length) {
      focusField(invalid[0]);
      return;
    }

    if (action === 'whatsapp' || action === 'email') {
      // Synchronous, still inside the click: the browser treats it as the visitor's action.
      openExternal(action === 'whatsapp' ? whatsappUrl(data) : mailtoUrl(data));
      setStatus(action === 'whatsapp' ? 'opened-whatsapp' : 'opened-email');
      return;
    }

    setSentName(data.name);
    // Honeypot ticked: a bot. Show the normal thanks and send nothing.
    if ((form.elements.namedItem('botcheck') as HTMLInputElement | null)?.checked) {
      setStatus('success');
      return;
    }
    setStatus('pending');
    const ok = await sendToWeb3Forms(accessKey!.trim(), data, timeoutMs);
    if (!ok) setFellBack(true);
    setStatus(ok ? 'success' : 'failed');
  }

  function onBlur(event: FocusEvent<HTMLFormElement>) {
    const field = event.target.name as FieldName;
    if (!attempted || !FIELDS.includes(field)) return;
    const found = validateEnquiry(read(event.currentTarget)).errors;
    setErrors((now) => {
      const next = { ...now };
      if (field in found) next[field as keyof Errors] = found[field as keyof Errors];
      else delete next[field as keyof Errors];
      return next;
    });
  }

  function startAgain() {
    flushSync(() => {
      setStatus('idle');
      setErrors({});
      setAttempted(false);
      setFellBack(false);
    });
    focusField('name');
  }

  if (status === 'success') {
    return (
      <div role="status" className="grid justify-items-start gap-4">
        <CheckCircle aria-hidden="true" className="size-8 text-success" />
        <h3 ref={(heading) => heading?.focus()} tabIndex={-1} className="text-h3 text-text">
          Thanks, {sentName}. Your enquiry is with us.
        </h3>
        <p className="text-text-muted">We will reply by phone or email.</p>
        <Button variant="ghost" onClick={startAgain} className="mt-2 max-sm:w-full">
          Send another
        </Button>
      </div>
    );
  }

  const pending = status === 'pending';
  const errorList = FIELDS.filter((field) => field in errors) as (keyof Errors)[];
  const describe = (field: FieldName, helper: boolean) =>
    [helper && `${id(field)}-help`, field in errors && `${id(field)}-error`].filter(Boolean).join(' ') || undefined;
  const aria = (field: FieldName, helper = false) => ({
    id: id(field),
    name: field,
    'aria-invalid': field in errors,
    'aria-describedby': describe(field, helper),
  });

  return (
    <form
      ref={formRef}
      method="post"
      noValidate
      aria-labelledby="contact-title"
      onSubmit={onSubmit}
      onBlur={onBlur}
      className="grid gap-6"
    >
      <div role="alert" className="empty:hidden">
        {errorList.length ? (
          <div className="rounded-card border border-ember-300 bg-ember-900/60 p-4">
            <p className="flex items-center gap-2 font-medium text-text">
              <Warning aria-hidden="true" className="size-5 flex-none text-error" />
              Please fix the following before sending:
            </p>
            <ul className="mt-2 grid gap-1 ps-7">
              {errorList.map((field) => (
                <li key={field}>
                  <a
                    href={`#${id(field)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      focusField(field);
                    }}
                    className="ui-link text-small text-error"
                  >
                    {LABELS[field]}: {errors[field]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field field="name" label="Your name" error={errors.name}>
          <input {...aria('name')} type="text" autoComplete="name" required className={`${control} h-13`} />
        </Field>
        <Field field="phone" label="Phone number" helper="Indian mobile number, 10 digits" error={errors.phone}>
          <input
            {...aria('phone', true)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className={`${control} h-13`}
          />
        </Field>
        <Field field="email" label="Email" optional error={errors.email}>
          <input
            {...aria('email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className={`${control} h-13`}
          />
        </Field>
        <Field field="business" label="Business name" optional>
          <input {...aria('business')} type="text" autoComplete="organization" className={`${control} h-13`} />
        </Field>
        <Field field="service" label="What do you need?" className="md:col-span-2">
          <div className="relative">
            <select {...aria('service')} defaultValue="" className={`${control} h-13 appearance-none pe-12`}>
              <option value="">Choose one</option>
              {SERVICES.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
              <option value={NOT_SURE}>{NOT_SURE}</option>
            </select>
            <CaretDown
              aria-hidden="true"
              className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-text-muted"
            />
          </div>
        </Field>
        <Field
          field="message"
          label="Message"
          helper="A line or two about your business and what you want"
          error={errors.message}
          className="md:col-span-2"
        >
          <textarea {...aria('message', true)} rows={4} maxLength={MESSAGE_MAX} className={`${control} min-h-32 py-3.5`} />
        </Field>
      </div>

      {keyMode ? (
        // Honeypot (key mode only): off screen, out of the tab order and hidden from screen readers.
        <div aria-hidden="true" className="absolute -start-[200vw] size-px overflow-hidden">
          <label>
            Leave this box empty
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      ) : null}

      {status === 'failed' ? (
        <p role="alert" className="flex gap-3 rounded-card border border-ember-300 bg-ember-900/60 p-4 text-text">
          <Warning aria-hidden="true" className="mt-0.5 size-5 flex-none text-error" />
          That did not go through. Your details are still here. Try again, or send them on WhatsApp or by email.
        </p>
      ) : null}

      {keyMode && !fellBack ? (
        <div className="flex flex-col sm:flex-row">
          <Button type="submit" value="web3forms" size="lg" disabled={pending} className="max-sm:w-full">
            {pending ? 'Sending…' : 'Send enquiry'}
          </Button>
        </div>
      ) : (
        <>
          <p className="flex gap-3 text-small text-text-muted">
            <Info aria-hidden="true" className="mt-px size-5 flex-none text-salmon" />
            This opens WhatsApp or your email app with your details filled in. Nothing is sent until you press send
            there.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="submit" value="whatsapp" size="lg" icon={<WhatsappLogo />} className="max-sm:w-full">
              Send on WhatsApp
            </Button>
            <Button type="submit" value="email" variant="ghost" size="lg" icon={<EnvelopeSimple />} className="max-sm:w-full">
              Send by email
            </Button>
            {keyMode ? (
              <Button type="submit" value="web3forms" variant="ghost" size="lg" className="max-sm:w-full">
                Send enquiry
              </Button>
            ) : null}
          </div>
        </>
      )}

      <div role="status" className="empty:hidden">
        {status === 'opened-whatsapp' || status === 'opened-email' ? (
          <div className="grid gap-1 rounded-card border border-hairline bg-white/3 p-4">
            <p className="flex gap-3 text-text">
              <CheckCircle aria-hidden="true" className="mt-0.5 size-5 flex-none text-success" />
              {status === 'opened-whatsapp'
                ? 'WhatsApp opened with your message. Press send there to reach us.'
                : 'Your email app opened with your message. Press send there to reach us.'}
            </p>
            <p className="ps-8 text-small text-text-muted">
              Did nothing open?{' '}
              <a href={site.phones[0].tel} className="ui-link">
                Call {site.phones[0].display}
              </a>
              .
            </p>
          </div>
        ) : null}
      </div>

      <p className="text-small text-text-muted">
        We use these details only to reply to your enquiry.{' '}
        <Link href="/privacy" className="ui-link">
          Privacy
        </Link>
      </p>
    </form>
  );
}

type FieldProps = {
  field: FieldName;
  label: string;
  optional?: boolean;
  helper?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label above, then the control, the helper and the error (icon plus words, never colour alone). */
function Field({ field, label, optional, helper, error, className, children }: FieldProps) {
  return (
    <div className={`grid content-start gap-2 ${className ?? ''}`}>
      <label htmlFor={id(field)} className="text-small font-medium text-text">
        {label}
        {optional ? <span className="font-normal text-text-muted"> (optional)</span> : null}
      </label>
      {children}
      {helper ? (
        <p id={`${id(field)}-help`} className="text-small text-text-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id(field)}-error`} className="flex items-start gap-2 text-small text-error">
          <Warning aria-hidden="true" className="mt-0.5 size-4 flex-none" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
