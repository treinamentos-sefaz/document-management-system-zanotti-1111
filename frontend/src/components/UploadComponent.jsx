import { useRef, useState } from 'react';
import { formatFileSize } from '../utils.js';

export default function UploadComponent({ onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function selectFile(nextFile) {
    if (!nextFile) return;
    setFile(nextFile);
    setMessage('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (!file || busy) return;

    setBusy(true);
    setMessage('');
    setError('');
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage('Documento enviado.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={submit}>
      <label
        className={`drop-zone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={(event) => selectFile(event.target.files[0])}
          aria-label="Selecionar documento para envio"
          disabled={busy}
        />
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="drop-copy">
          <strong>{file ? file.name : 'Solte um arquivo aqui'}</strong>
          <span>{file ? formatFileSize(file.size) : 'ou escolha no seu dispositivo'}</span>
        </span>
        <span className="choose-file">Escolher arquivo</span>
      </label>
      <div className="upload-actions">
        <p>Um arquivo por envio · limite padrão de 10 MiB</p>
        <button className="primary-button" type="submit" disabled={!file || busy}>
          {busy ? 'Enviando…' : 'Enviar documento'}
        </button>
      </div>
      <p className="form-feedback" role="status" aria-live="polite">
        {error && <span className="error-text">{error}</span>}
        {!error && message}
      </p>
    </form>
  );
}