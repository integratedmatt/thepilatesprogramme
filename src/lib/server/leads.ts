/**
 * Lead capture. Writes to the configured ESP. [CLIENT TO CONFIRM: Arketa vs dedicated ESP such as Kit]
 * LEAD_PROVIDER=kit uses the Kit v4 API. LEAD_PROVIDER=log (default) records to the server log.
 * Every lead carries `path` and `source_page` so nurture sequences can branch (Section 9.2).
 */
export interface Lead {
  email: string;
  firstName?: string;
  path: string;        // qualify | continue | studio | unknown
  sourcePage: string;
  formId: string;
  tag?: string;
  course?: string;
}

export async function addLead(lead: Lead): Promise<void> {
  const provider = (import.meta.env.LEAD_PROVIDER as string | undefined) || 'log';
  if (provider === 'kit') return addToKit(lead);
  console.info('[lead]', JSON.stringify(lead));
}

async function addToKit(lead: Lead): Promise<void> {
  const key = import.meta.env.KIT_API_KEY as string | undefined;
  if (!key) throw new Error('KIT_API_KEY missing');
  const headers = { 'content-type': 'application/json', 'X-Kit-Api-Key': key };
  const res = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email_address: lead.email, first_name: lead.firstName, state: 'active', fields: { path: lead.path, source_page: lead.sourcePage, form_id: lead.formId, course: lead.course ?? '' } }),
  });
  if (!res.ok && res.status !== 409) throw new Error(`Kit subscriber failed: ${res.status}`);
  const formId = import.meta.env.KIT_FORM_ID as string | undefined;
  if (formId) {
    await fetch(`https://api.kit.com/v4/forms/${formId}/subscribers`, { method: 'POST', headers, body: JSON.stringify({ email_address: lead.email }) });
  }
  if (lead.tag) {
    // Tags are created in Kit by name; look up then tag. Non-fatal.
    try {
      const tags = await (await fetch('https://api.kit.com/v4/tags?per_page=500', { headers })).json() as { tags?: { id: number; name: string }[] };
      const tag = tags.tags?.find((t) => t.name === lead.tag);
      if (tag) await fetch(`https://api.kit.com/v4/tags/${tag.id}/subscribers`, { method: 'POST', headers, body: JSON.stringify({ email_address: lead.email }) });
    } catch (e) { console.warn('[lead] tag failed', e); }
  }
}
