'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  name: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}

export function FormField({ label, name, error, required, children, description }: FormFieldProps) {
  const t = useTranslations('validation');
  const errorId = `${name}-error`;
  const descId = description ? `${name}-desc` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </Label>
      {description && (
        <p id={descId} className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error.message?.startsWith('validation.') ? t(error.message.replace('validation.', '') as 'required' | 'invalidEmail' | 'invalidPhone') : error.message}
        </p>
      )}
    </div>
  );
}

/** Reusable text input with form field wrapper */
interface TextInputFieldProps {
  label: string;
  name: string;
  error?: FieldError;
  required?: boolean;
  type?: string;
  placeholder?: string;
  description?: string;
  register: Record<string, unknown>;
}

export function TextInputField({
  label,
  name,
  error,
  required,
  type = 'text',
  placeholder,
  description,
  register,
}: TextInputFieldProps) {
  const errorId = `${name}-error`;
  const descId = description ? `${name}-desc` : undefined;

  return (
    <FormField label={label} name={name} error={error} required={required} description={description}>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        error={!!error}
        aria-describedby={cn(error && errorId, descId)}
        {...register}
      />
    </FormField>
  );
}
