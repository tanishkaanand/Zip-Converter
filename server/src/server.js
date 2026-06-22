import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectDir = path.resolve(rootDir, '..');
const uploadDir = path.join(rootDir, 'uploads');
const zipDir = path.join(rootDir, 'zips');
const clientDistDir = path.join(projectDir, 'client', 'dist');

const app = express();
const port = process.env.PORT || 5001;
const clientOrigin = process.env.CLIENT_ORIGIN || ['http://127.0.0.1:5173', 'http://localhost:5173'];

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx', '.pptx']);
const jobs = new Map();

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(zipDir, { recursive: true });

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginalName = sanitizeFileName(file.originalname);
    cb(null, `${Date.now()}-${nanoid(8)}-${safeOriginalName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 30,
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      cb(new Error(`Unsupported file type: ${extension || 'unknown'}`));
      return;
    }

    cb(null, true);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/zip', upload.array('files'), async (req, res, next) => {
  try {
    const files = req.files || [];

    if (files.length === 0) {
      res.status(400).json({ message: 'Upload at least one supported file.' });
      return;
    }

    const id = nanoid(16);
    const zipName = buildZipName(files);
    const zipPath = path.join(zipDir, `${id}-${zipName}`);

    await createZip(files, zipPath);

    jobs.set(id, {
      zipPath,
      zipName,
      files: files.map((file) => file.path),
      createdAt: Date.now()
    });

    res.status(201).json({
      id,
      fileName: zipName,
      downloadUrl: `/api/download/${id}`
    });
  } catch (error) {
    cleanupFiles((req.files || []).map((file) => file.path));
    next(error);
  }
});

app.get('/api/download/:id', (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job || !fs.existsSync(job.zipPath)) {
    res.status(404).json({ message: 'ZIP file not found or already downloaded.' });
    return;
  }

  res.download(job.zipPath, job.zipName, (error) => {
    cleanupJob(req.params.id);

    if (error && !res.headersSent) {
      res.status(500).json({ message: 'Download failed.' });
    }
  });
});

if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  const status = error.message?.startsWith('Unsupported file type') ? 400 : 500;
  res.status(status).json({
    message: status === 400 ? error.message : 'Something went wrong while creating the ZIP.'
  });
});

setInterval(() => {
  const maxAgeMs = 60 * 60 * 1000;

  for (const [id, job] of jobs.entries()) {
    if (Date.now() - job.createdAt > maxAgeMs) {
      cleanupJob(id);
    }
  }
}, 15 * 60 * 1000).unref();

app.listen(port, () => {
  console.log(`ZIP converter running on port ${port}`);
});

function createZip(files, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    for (const file of files) {
      archive.file(file.path, { name: sanitizeFileName(file.originalname) });
    }

    archive.finalize();
  });
}

function cleanupJob(id) {
  const job = jobs.get(id);

  if (!job) {
    return;
  }

  cleanupFiles([...job.files, job.zipPath]);
  jobs.delete(id);
}

function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    fs.rm(filePath, { force: true }, () => {});
  }
}

function sanitizeFileName(fileName) {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildZipName(files) {
  const firstFileName = path.parse(files[0].originalname).name;
  const baseName = sanitizeZipBaseName(firstFileName) || 'converted-files';

  if (files.length === 1) {
    return `${baseName}.zip`;
  }

  return `${baseName}-and-${files.length - 1}-more.zip`;
}

function sanitizeZipBaseName(fileName) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 60);
}
