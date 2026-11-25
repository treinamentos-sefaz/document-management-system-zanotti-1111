import { useEffect, useState } from 'react';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './App.css';

const USER_STORAGE_KEY = 'dms-user-id';

function readSavedUser() {
  try {
    return window.localStorage.getItem(USER_STORAGE_KEY) || 'usuario-demo';
  } catch {
    return 'usuario-demo';
  }
}

export default function App() {
  const [owner, setOwner] = useState(readSavedUser);
  const [ownerDraft, setOwnerDraft] = useState(readSavedUser);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, owner);
    } catch {
      // A identidade continua utilizável durante a sessão se o storage estiver indisponível.
    }
  }, [owner]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    listDocuments(owner)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [owner, refreshKey]);

  async function handleUpload(file) {
    const document = await uploadDocument(file, owner);
    setRefreshKey((key) => key + 1);
    return document;
  }

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextOwner = ownerDraft.trim();
    if (nextOwner) setOwner(nextOwner);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Arquivo, início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>arquivo<span className="brand-period">.</span></span>
        </a>
        <form className="identity-form" onSubmit={handleUserSubmit}>
          <label htmlFor="user-id">Espaço de trabalho</label>
          <input
            id="user-id"
            value={ownerDraft}
            onChange={(event) => setOwnerDraft(event.target.value)}
            maxLength={80}
            autoComplete="off"
          />
          <button type="submit" disabled={!ownerDraft.trim() || ownerDraft.trim() === owner}>
            Aplicar
          </button>
        </form>
      </header>

      <main id="main" className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">BIBLIOTECA PESSOAL</p>
            <h1 id="page-title">Documentos</h1>
            <p className="page-subtitle">Envie, organize e acesse seus arquivos.</p>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-number">{documents.length.toString().padStart(2, '0')}</span>
            <span>{documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
          </div>
        </section>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR À BIBLIOTECA</p>
              <h2 id="upload-title">Novo documento</h2>
            </div>
            <span className="section-index">01</span>
          </div>
          <UploadComponent onUpload={handleUpload} />
        </section>

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading list-heading">
            <div>
              <p className="eyebrow">SEUS ARQUIVOS</p>
              <h2 id="documents-title">Todos os documentos</h2>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
            >
              Atualizar lista
            </button>
          </div>
          <DocumentList
            documents={documents}
            owner={owner}
            loading={loading}
            error={loadError}
            onRetry={() => setRefreshKey((key) => key + 1)}
          />
        </section>
      </main>
      <footer className="app-footer">
        <span>ARQUIVO LOCAL</span>
        <span>Os documentos são armazenados neste servidor.</span>
      </footer>
    </div>
  );
}
