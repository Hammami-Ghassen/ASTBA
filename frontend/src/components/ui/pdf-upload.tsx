'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import { uploadsApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');

interface PdfUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function PdfUpload({ value, onChange, disabled }: PdfUploadProps) {
  const t = useTranslations('trainings');
  const tc = useTranslations('common');
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveDocSrc = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_ORIGIN}${url}`;
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        addToast(t('pdfInvalidType'), 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast(t('pdfTooLarge'), 'error');
        return;
      }

      setUploading(true);
      try {
        const result = await uploadsApi.uploadDocument(file);
        onChange(result.documentUrl);
        setFileName(file.name);
        addToast(t('pdfUploadSuccess'), 'success');
      } catch {
        addToast(tc('error'), 'error');
      } finally {
        setUploading(false);
      }
    },
    [onChange, addToast, t, tc],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
    setFileName('');
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#192233] p-4">
          <FileText className="h-8 w-8 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {fileName || t('pdfDocument')}
            </p>
            <a
              href={resolveDocSrc(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#135bec] hover:underline"
            >
              {t('pdfView')}
            </a>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600 transition-colors shrink-0"
              aria-label={tc('delete')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
            dragOver
              ? 'border-[#135bec] bg-blue-50 dark:bg-blue-950/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && !uploading) inputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.click();
            }
          }}
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
                <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {uploading ? t('pdfUploading') : t('pdfDragOrClick')}
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            {t('pdfFormat')}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="absolute w-0 h-0 overflow-hidden opacity-0"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        tabIndex={-1}
        aria-label={t('pdfDocument')}
      />
    </div>
  );
}
