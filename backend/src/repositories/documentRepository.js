const documents = new Map();

function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function create(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((left, right) => {
      const byDate = right.uploadedAt.localeCompare(left.uploadedAt);
      return byDate || left.id.localeCompare(right.id);
    })
    .map(toPublicDocument);
}

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  return document && document.owner === owner ? { ...document } : null;
}

module.exports = {
  create,
  listByOwner,
  findByIdAndOwner,
};