import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document, owner }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const blob = await downloadDocument(document.id, owner);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = document.originalName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="download-control">
      <button className="text-button" type="button" onClick={download} disabled={busy}>
        {busy ? 'Baixando…' : 'Baixar'}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}