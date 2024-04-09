import { existsSync, rmSync } from 'fs';

type IndexResource = {
  index: unknown;
  indexBuildingPromise: Promise<unknown> | null;
};

const INDEXES = new Map<string, IndexResource>();

async function buildResource<T>(resourceFile: string, buildFn: () => Promise<T>): Promise<T> {
  const resource = INDEXES.get(resourceFile);
  if (resource?.index) return resource.index as T;

  if (resource?.indexBuildingPromise) {
    return (await resource.indexBuildingPromise) as T;
  }

  const indexBuildingPromise = buildFn().then((index) => {
    INDEXES.set(resourceFile, { index, indexBuildingPromise: null });
    return index;
  });
  INDEXES.set(resourceFile, { index: null, indexBuildingPromise });

  return await indexBuildingPromise;
}

export default async function findOrCreateResourceFromFile<T>(
  resourceFile: string,
  clobber: boolean,
  restoreFn: () => T,
  buildFn: () => Promise<T>
): Promise<T> {
  if (existsSync(resourceFile)) {
    if (clobber) {
      console.warn(
        `File ${resourceFile} already exists and --clobber option is set, so it will be rebuilt.`
      );

      rmSync(resourceFile, { recursive: true, force: true });
    }
  }

  let result: T;
  if (!existsSync(resourceFile)) {
    console.log(`Building index in file: ${resourceFile}`);
    result = await buildResource(resourceFile, buildFn);
  } else {
    console.log(`Using existing index from file: ${resourceFile}`);
    result = restoreFn();
  }
  return result;
}
