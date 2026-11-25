const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function createDocument({ originalName, size, owner, storagePath }) {
  return documentRepository.create({
    id: randomUUID(),
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath,
  });
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner);
}

function getDocumentForOwner(id, owner) {
  return documentRepository.findByIdAndOwner(id, owner);
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForOwner,
};