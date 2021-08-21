export enum Format {
  YAML = 'yaml',
  JSON = 'json',
  Text = 'text',
}

export interface DiffEntry {
  added: boolean;
  removed: boolean;
  count: integer;
  value: string;
}
