import { AnySchema } from 'ajv';
import { PartialDeep } from 'type-fest';
import { ValidationError } from '../errors';

type ValidationErrorDescription = {
  level: 'warning' | 'error';
  message: string;
  setting?: string;
  filename?: string;
  detailed_message?: string;
  help_urls?: string[];
};

export type ValidationResult = {
  errors?: ValidationErrorDescription[];
  schema?: AnySchema | AnySchema[];
};

function normalizeErrorDescription(raw: Partial<ValidationErrorDescription>): ValidationErrorDescription {
  return { level: raw.level || 'error', message: raw.message || '', ...raw }
}

export function parseValidationResult(json: string): ValidationResult {
  try {
    const raw: PartialDeep<ValidationResult> | Partial<ValidationErrorDescription>[] = JSON.parse(json);
    if (Array.isArray(raw)) return { errors: raw.map(normalizeErrorDescription) };
    return { ...raw, errors: raw.errors?.map(normalizeErrorDescription) };
  } catch (e) {
    throw new ValidationError(`Unable to parse validation output.\n${e}\nOutput:\n${json}`);
  }
}

export function formatValidationError(e: ValidationErrorDescription): string {
  const m = [e.level.charAt(0).toUpperCase(), e.level.slice(1), ': ', e.message];
  if (e.filename) m.push(' in ', e.filename);
  if (e.setting) m.push(' at ', e.setting);
  if (e.detailed_message) m.push('\n', e.detailed_message);
  if (e.help_urls) m.push('\n', 'See: ', e.help_urls.join('\n\t'));

  return m.join('');
}
