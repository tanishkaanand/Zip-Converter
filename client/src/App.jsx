import { useMemo, useRef, useState } from 'react';
import { Archive, CheckCircle2, Download, FileArchive, FileUp, Loader2, ShieldCheck, Sparkles, Trash2, XCircle, Zap } from 'lucide-react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const acceptedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'pptx'];
const acceptValue = acceptedExtensions.map((extension) => `.${extension}`).join(',');

export default function App() {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  function addFiles(fileList) {
    const incoming = Array.from(fileList);
    const supported = incoming.filter(isSupportedFile);
    const rejectedCount = incoming.length - supported.length;

    setError(rejectedCount ? `${rejectedCount} unsupported file${rejectedCount > 1 ? 's were' : ' was'} skipped.` : '');
    setResult(null);
    setFiles((current) => [...current, ...supported]);
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_file, fileIndex) => fileIndex !== index));
    setResult(null);
  }

  function clearFiles() {
    setFiles([]);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (files.length === 0) {
      setError('Choose at least one supported file first.');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/zip`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not create ZIP.');
      }

      setResult({
        fileName: data.fileName,
        url: `${apiBaseUrl}${data.downloadUrl}`
      });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f1] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white shadow-lg shadow-teal-900/15">
              <FileArchive className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase text-teal-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Fast online file utility
              </p>
              <h1 className="mt-1 text-4xl font-black sm:text-5xl">ZIP Converter</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Bundle images, PDFs, and Office files into one clean ZIP archive in seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <Archive className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>{files.length} files selected</span>
          </div>
        </header>

        <div className="grid gap-3 py-5 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-teal-100 bg-white px-4 py-3 shadow-sm">
            <Zap className="h-5 w-5 text-teal-700" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">Quick ZIP creation</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-lime-100 bg-white px-4 py-3 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-lime-700" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">Files removed after download</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm">
            <FileArchive className="h-5 w-5 text-sky-700" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">JPG, PNG, PDF, DOCX, XLSX, PPTX</span>
          </div>
        </div>

        <div className="grid flex-1 gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <form onSubmit={handleSubmit} className="flex min-h-[520px] flex-col gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={`group flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center shadow-sm transition ${
                isDragging ? 'border-teal-600 bg-teal-50 ring-4 ring-teal-100' : 'border-slate-300 bg-white hover:border-teal-500 hover:bg-teal-50/50'
              }`}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-teal-700 text-white shadow-xl shadow-teal-900/15 transition group-hover:scale-105">
                <FileUp className="h-10 w-10" aria-hidden="true" />
              </div>
              <span className="mt-5 text-2xl font-black">Drop files here or browse</span>
              <span className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                Supports JPG, PNG, PDF, DOCX, XLSX, and PPTX files. Multiple files are bundled into one ZIP archive.
              </span>
              <span className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-teal-700">
                Choose files
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptValue}
              onChange={(event) => addFiles(event.target.files)}
              className="sr-only"
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-sm">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-4 text-teal-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
                  <span className="font-medium">{result.fileName} is ready.</span>
                </div>
                <a
                  href={result.url}
                  onClick={() => setResult(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:bg-teal-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download ZIP
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="text-sm text-slate-600">
                Total size: <span className="font-bold text-slate-950">{formatBytes(totalSize)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearFiles}
                  disabled={!files.length || isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!files.length || isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
                  {isUploading ? 'Creating ZIP' : 'Create ZIP'}
                </button>
              </div>
            </div>
          </form>

          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <h2 className="text-base font-black">Selected files</h2>
              <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800">{files.length}</span>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-2">
              {files.length ? (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:border-teal-200 hover:bg-teal-50/40">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-black uppercase text-white">
                        {getExtension(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
                  Files you add will appear here before conversion.
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500">
          <p>Copyright © {new Date().getFullYear()} Tanishka Anand. All rights reserved.</p>
        </footer>
      </section>
    </main>
  );
}

function isSupportedFile(file) {
  return acceptedExtensions.includes(getExtension(file.name));
}

function getExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function formatBytes(bytes) {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
