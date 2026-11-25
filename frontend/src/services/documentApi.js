const API_BASE = '/api';

async function ensureSuccess(response) {
  if (response.ok) return response;

  let message = 'Não foi possível concluir a solicitação.';
  try {
    const body = await response.json();
    message = body.error?.message || message;
  } catch {
    // Mantém a mensagem padrão quando o servidor não retorna JSON.
  }
  throw new Error(message);
}

function userHeaders(owner) {
  return { 'X-User-Id': owner };
}

export async function listDocuments(owner) {
  const response = await ensureSuccess(await fetch(`${API_BASE}/documents`, {
    headers: userHeaders(owner),
  }));
  return response.json();
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await ensureSuccess(await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: userHeaders(owner),
    body: formData,
  }));
  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await ensureSuccess(await fetch(
    `${API_BASE}/documents/${encodeURIComponent(id)}/download`,
    { headers: userHeaders(owner) },
  ));
  return response.blob();
}