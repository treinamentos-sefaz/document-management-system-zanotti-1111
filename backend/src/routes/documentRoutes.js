const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const documentController = require('../controllers/documentController');

const router = express.Router();
const backendRoot = path.resolve(__dirname, '../..');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(backendRoot, process.env.STORAGE_DIR)
  : path.join(backendRoot, 'storage');
const configuredFileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);

if (
  !Number.isSafeInteger(configuredFileSize)
  || configuredFileSize <= 0
  || configuredFileSize === Number.MAX_SAFE_INTEGER
) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDirectory, { recursive: true }, (error) => {
        callback(error, storageDirectory);
      });
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  }),
  limits: {
    files: 1,
    fileSize: configuredFileSize + 1,
  },
});

function exposeFileSizeLimit(req, res, next) {
  req.maxFileSizeBytes = configuredFileSize;
  next();
}

router.post(
  '/upload',
  documentController.requireOwner,
  exposeFileSizeLimit,
  upload.single('file'),
  documentController.upload,
);
router.get('/documents', documentController.requireOwner, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireOwner,
  documentController.download,
);

module.exports = router;