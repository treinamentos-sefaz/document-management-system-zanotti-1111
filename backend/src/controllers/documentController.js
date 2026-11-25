const fs = require('node:fs/promises');
const documentService = require('../services/documentService');

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id');
  if (!owner || !owner.trim()) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'O cabeçalho X-User-Id é obrigatório.',
      },
    });
  }

  req.owner = owner.trim();
  return next();
}

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Envie um arquivo no campo file.',
      },
    });
  }

  if (req.file.size > req.maxFileSizeBytes) {
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        return next(error);
      }
    }
    return res.status(413).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'O arquivo excede o limite permitido.',
      },
    });
  }

  try {
    const document = documentService.createDocument({
      originalName: req.file.originalname,
      size: req.file.size,
      owner: req.owner,
      storagePath: req.file.path,
    });
    return res.status(201).json(document);
  } catch (error) {
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error('Não foi possível remover o arquivo após falha:', cleanupError);
      }
    }
    return next(error);
  }
}

function list(req, res, next) {
  try {
    return res.json(documentService.listDocuments(req.owner));
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  const document = documentService.getDocumentForOwner(req.params.id, req.owner);
  if (!document) {
    return res.status(404).json({
      error: {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      },
    });
  }

  return res.download(document.storagePath, document.originalName, (error) => {
    if (!error) {
      return;
    }
    if (res.headersSent) {
      return next(error);
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento não encontrado.',
        },
      });
    }
    return next(error);
  });
}

module.exports = {
  requireOwner,
  upload,
  list,
  download,
};