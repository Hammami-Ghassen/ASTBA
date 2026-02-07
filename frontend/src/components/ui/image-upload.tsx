'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadsApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveImageSrc = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // relative path like /uploads/xxx.jpg → prepend backend origin
    return `${BACKEND_ORIGIN}${url}`;
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        addToast(t('imageInvalidType'), 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addToast(t('imageTooLarge'), 'error');
        return;
      }

      setUploading(true);
      try {
        const result = await uploadsApi.uploadImage(file);
        onChange(result.imageUrl);
        addToast(t('imageUploadSuccess'), 'success');
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
    // Reset so the same file can be re-selected
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
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageSrc(value)}
            alt={t('image')}
            className="h-32 w-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 transition-colors"
              aria-label={tc('delete')}
            >
              <X className="h-3 w-3" />
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
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
              inputRef.current?.click();
            }
          }}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          ) : (
            <Upload className="h-8 w-8 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {uploading ? t('imageUploading') : t('imageDragOrClick')}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t('imageFormats')}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        aria-label={t('image')}
      />
    </div>
  );
}
