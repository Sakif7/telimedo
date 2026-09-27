'use server';

/* Book a demo: server action stub. It validates the request and returns; nothing
   is stored or sent yet. Connect it to the inbox or CRM before launch, then
   remove the "not connected" note from content/site.ts (demo.note). */

export type DemoRequestResult = { ok: true } | { ok: false; field: 'name' | 'email' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestDemo(formData: FormData): Promise<DemoRequestResult> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  if (!name || name.length > 200) return { ok: false, field: 'name' };
  if (!EMAIL.test(email) || email.length > 320) return { ok: false, field: 'email' };
  return { ok: true };
}
