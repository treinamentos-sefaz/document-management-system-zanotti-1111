const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function registerUpload(file, owner) {
  return documentRepository.create({
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
    storagePath: file.path,
  });
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner);
}

function getDocumentForOwner(id, owner) {
  return documentRepository.findByIdAndOwner(id, owner);
}

module.exports = {
  registerUpload,
  listDocuments,
  getDocumentForOwner,
};