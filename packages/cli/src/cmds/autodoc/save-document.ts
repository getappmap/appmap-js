import { warn } from 'console';
import { Document } from '../../autodoc/types';

export default function saveDocument(document: Document): Promise<void> {
  warn(`saveDocument not implemented`);
  return Promise.resolve();
}
