import { useMemo, useRef, useState } from 'react';
import { Archive, CheckCircle2, Download, FileUp, Loader2, Trash2, XCircle } from 'lucide-react';

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
    <main className="min-h-screen bg-[#f7f7f2] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-stone-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Full-stack file utility</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">ZIP Converter</h1>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">
            <Archive className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>{files.length} files selected</span>
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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
              className={`flex min-h-[260px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white px-6 py-10 text-center transition ${
                isDragging ? 'border-teal-600 ring-4 ring-teal-100' : 'border-stone-300 hover:border-teal-500'
              }`}
            >
              <FileUp className="h-12 w-12 text-teal-700" aria-hidden="true" />
              <span className="mt-4 text-xl font-semibold">Drop files here or browse</span>
              <span className="mt-2 max-w-lg text-sm leading-6 text-stone-600">
                Supports JPG, PNG, PDF, DOCX, XLSX, and PPTX files. Multiple files are bundled into one ZIP archive.
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
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-3 rounded-md border border-teal-200 bg-teal-50 px-4 py-4 text-teal-950 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
                  <span className="font-medium">{result.fileName} is ready.</span>
                </div>
                <a
                  href={result.url}
                  onClick={() => setResult(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download ZIP
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-300 bg-white px-4 py-3">
              <div className="text-sm text-stone-600">
                Total size: <span className="font-semibold text-stone-900">{formatBytes(totalSize)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearFiles}
                  disabled={!files.length || isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!files.length || isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
                  {isUploading ? 'Creating ZIP' : 'Create ZIP'}
                </button>
              </div>
            </div>
          </form>

          <aside className="rounded-lg border border-stone-300 bg-white">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-base font-semibold">Selected files</h2>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-2">
              {files.length ? (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-md border border-stone-200 px-3 py-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-xs font-bold uppercase text-teal-800">
                        {getExtension(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-stone-500">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                        className="rounded-md p-2 text-stone-500 transition hover:bg-stone-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove ${file.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm leading-6 text-stone-500">
                  Files you add will appear here before conversion.
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="border-t border-stone-300 py-4 text-center text-sm text-stone-600">
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
