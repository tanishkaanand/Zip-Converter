# ZIP Converter

A full-stack ZIP converter MVP built with React, Tailwind CSS, Node.js, and Express. Users can upload multiple supported files and download them as a single ZIP archive.

## Features

- Upload multiple `jpg`, `png`, `pdf`, `docx`, `xlsx`, and `pptx` files
- Convert uploads into one `.zip`
- Download the generated ZIP
- Automatically delete temporary files after download
- Responsive React UI
- Production-ready single-service deployment support

## Project Structure

```text
zip-converter/
  client/
    src/                 React frontend
    vite.config.js       Vite dev server config
    tailwind.config.js   Tailwind CSS config
  server/
    src/server.js        Express API and production static server
    uploads/             Temporary uploaded files
    zips/                Temporary generated ZIP files
```

## Tech Stack

- React
- Vite
- Tailwind CSS
- Node.js
- Express
- Multer
- Archiver

## Local Setup

```bash
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

Backend: `http://127.0.0.1:5001`

## Production Build

```bash
npm install
npm run build --workspace client
npm start
```

The Express server serves the built React app from `client/dist` in production.

## API

- `POST /api/zip` accepts multipart field `files`
- `GET /api/download/:id` downloads the ZIP and deletes temporary files

## Upload Limits

The backend currently allows:

- Up to 30 files per upload
- Up to 25 MB per file

These values can be changed in `server/src/server.js`.

## Deployment

This project can be deployed as a single free Render Web Service.

Recommended Render settings:

```text
Build Command: npm install && npm run build --workspace client
Start Command: npm start
```

No custom domain is required. Render provides a free `.onrender.com` URL.

## Environment Variables

Optional:

```text
PORT=5001
CLIENT_ORIGIN=http://127.0.0.1:5173
```

Do not commit `.env` files or secrets to GitHub. They are ignored by `.gitignore`.

## Copyright

Copyright © 2026 Tanishka Anand. All rights reserved.
