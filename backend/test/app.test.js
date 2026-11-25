const { after, before, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const storageDirectory = path.join(os.tmpdir(), `dms-test-${process.pid}`);

process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '5';

const app = require('../src/app');
let server;
let baseUrl;

async function uploadFile(owner, content, filename) {
  const form = new FormData();
  form.append('file', new Blob([content]), filename);
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await fs.rm(storageDirectory, { recursive: true, force: true });
});

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('POST /upload registra metadados e grava o conteúdo com nome interno', async () => {
  const uploadResponse = await uploadFile('upload-owner', 'hello', 'hello.txt');
  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'hello.txt');
  assert.strictEqual(document.size, 5);
  assert.strictEqual(document.owner, 'upload-owner');
  assert.ok(document.id);
  assert.ok(document.uploadedAt);
  assert.strictEqual('storagePath' in document, false);

  const storedFiles = await fs.readdir(storageDirectory);
  const storedContents = await Promise.all(
    storedFiles.map((filename) => fs.readFile(path.join(storageDirectory, filename), 'utf8')),
  );
  assert.ok(storedContents.includes('hello'));
  assert.ok(!storedFiles.includes('hello.txt'));
});

test('GET /documents lista apenas documentos do usuário', async () => {
  const firstUpload = await uploadFile('list-owner', 'first', 'first.txt');
  const secondUpload = await uploadFile('list-owner', 'other', 'second.txt');
  const unrelatedUpload = await uploadFile('other-owner', 'hello', 'other.txt');
  const firstDocument = await firstUpload.json();
  const secondDocument = await secondUpload.json();
  assert.strictEqual(unrelatedUpload.status, 201);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'list-owner' },
  });
  const documents = await listResponse.json();
  assert.strictEqual(documents.length, 2);
  assert.ok(documents.some((document) => document.id === firstDocument.id));
  assert.ok(documents.some((document) => document.id === secondDocument.id));
  assert.ok(documents.every((document) => document.owner === 'list-owner'));

  const otherUserResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'empty-owner' },
  });
  assert.deepStrictEqual(await otherUserResponse.json(), []);
});

test('GET /documents/:id/download entrega o arquivo apenas ao dono', async () => {
  const uploadResponse = await uploadFile('download-owner', 'hello', 'hello.txt');
  const document = await uploadResponse.json();

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'download-owner' },
  });
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'hello');
  assert.match(downloadResponse.headers.get('content-disposition'), /hello\.txt/);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'other-owner' },
  });
  assert.strictEqual(forbiddenDownload.status, 404);

  const missingDownload = await fetch(`${baseUrl}/documents/missing-id/download`, {
    headers: { 'X-User-Id': 'download-owner' },
  });
  assert.strictEqual(missingDownload.status, 404);
});

test('retorna erros para identidade ausente, arquivo ausente e arquivo grande', async () => {
  const missingIdentity = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingIdentity.status, 400);

  const emptyForm = new FormData();
  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: emptyForm,
  });
  assert.strictEqual(missingFile.status, 400);

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['123456']), 'large.txt');
  const oversizedFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-a' },
    body: oversizedForm,
  });
  assert.strictEqual(oversizedFile.status, 413);
  assert.strictEqual((await oversizedFile.json()).error.code, 'FILE_TOO_LARGE');
});
