import readIndexFile from '../readIndexFile';

export function collectLabels(labels: Set<string>) {
  return async (appmap: string) => {
    const appmapLabels = await readIndexFile(appmap, 'canonical.labels.json');
    for (const label of appmapLabels) labels.add(label);
  };
}
