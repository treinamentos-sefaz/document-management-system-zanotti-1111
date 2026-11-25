import DownloadButton from './DownloadButton.jsx';
import { formatDate, formatFileSize } from '../utils.js';

function fileExtension(name) {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.slice(0, 5).toUpperCase() : 'FILE';
}

export default function DocumentList({ documents, owner, loading, error, onRetry }) {
  if (loading) {
    return <div className="list-state" role="status">Carregando documentos…</div>;
  }

  if (error) {
    return (
      <div className="list-state list-error" role="alert">
        <span>{error}</span>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="empty-rule" aria-hidden="true" />
        <p>Nenhum documento por aqui.</p>
        <span>Os arquivos enviados aparecerão nesta lista.</span>
      </div>
    );
  }

  return (
    <div className="document-table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="file-name-cell">
                <span className="file-type" aria-hidden="true">{fileExtension(document.originalName)}</span>
                <span className="file-name" title={document.originalName}>{document.originalName}</span>
              </td>
              <td className="muted-cell">{formatFileSize(document.size)}</td>
              <td className="muted-cell">{formatDate(document.uploadedAt)}</td>
              <td className="action-cell">
                <DownloadButton document={document} owner={owner} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}