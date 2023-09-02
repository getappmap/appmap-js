import { readFile } from 'fs/promises';
import {
  unparseDiagram,
  validateDiagram,
  ValidationResult,
  Result,
} from '@appland/sequence-diagram';

export async function readDiagramFile(fileName: string): Promise<Result> {
  const jsonData = JSON.parse(await readFile(fileName, 'utf-8')) as any;

  const validate = validateDiagram(jsonData);
  if (validate !== ValidationResult.Valid) {
    console.error(`Invalid Diagram data in file: ${fileName}`);
    return { diagram: null, validationResult: validate };
  }

  const diagram = unparseDiagram(jsonData);
  return { diagram: diagram, validationResult: ValidationResult.Valid };
}
