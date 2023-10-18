import { warn } from 'console';

export default function normalizeAppMapId(id: string): string {
  let normalizedId = id;
  if (normalizedId.startsWith('./')) normalizedId = normalizedId.slice('./'.length);
  if (normalizedId.endsWith('.appmap.json')) {
    warn(`AppMap id ${id} should not include the file extension`);
    normalizedId = normalizedId.slice(0, '.appmap.json'.length * -1);
  }
  return normalizedId;
}
