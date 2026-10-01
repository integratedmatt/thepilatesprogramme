import { useState } from 'react';
import type { DocumentActionComponent } from 'sanity';
import { useClient } from 'sanity';

/** Approve: sets status approved and datePosted now. The Sanity webhook then emails the studio and triggers a rebuild. */
export const approveJob: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: '2026-10-01' });
  const doc = (props.draft || props.published) as { status?: string; validThrough?: string } | null;
  if (!doc || doc.status === 'approved') return null;
  return {
    label: 'Approve and publish',
    tone: 'positive',
    onHandle: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const validThrough = doc.validThrough && doc.validThrough > today ? doc.validThrough : plusDays(60);
      await client.patch(props.id).set({ status: 'approved', datePosted: today, approvedAt: new Date().toISOString(), validThrough, rejectReason: '' }).commit();
      if (props.draft) await client.action({ actionType: 'sanity.action.document.publish', draftId: `drafts.${props.id}`, publishedId: props.id }).catch(() => undefined);
      props.onComplete();
    },
  };
};

export const rejectJob: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: '2026-10-01' });
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const doc = (props.draft || props.published) as { status?: string } | null;
  if (!doc || doc.status === 'rejected') return null;
  return {
    label: 'Reject',
    tone: 'critical',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Reject listing',
      onClose: () => setOpen(false),
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          <label>Optional reason sent to the studio<br />
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ width: '100%' }} />
          </label>
          <button type="button" onClick={async () => { await client.patch(props.id).set({ status: 'rejected', rejectReason: reason }).commit(); setOpen(false); props.onComplete(); }}>Confirm reject</button>
        </div>
      ),
    },
  };
};

export const approveGraduate: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: '2026-10-01' });
  const doc = (props.draft || props.published) as { status?: string } | null;
  if (!doc || doc.status === 'approved') return null;
  return {
    label: 'Approve profile',
    tone: 'positive',
    onHandle: async () => { await client.patch(props.id).set({ status: 'approved' }).commit(); props.onComplete(); },
  };
};

function plusDays(n: number): string { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
