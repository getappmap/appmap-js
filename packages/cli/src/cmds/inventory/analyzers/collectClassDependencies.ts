import DependencyMap from '../DependencyMap';
import readIndexFile from '../readIndexFile';

export function collectClassDependencies(uniqueClassDependencies: DependencyMap) {
  return async (appmap: string) => {
    const classDependencies = await readIndexFile(appmap, 'canonical.classDependencies.json');
    for (const dependency of classDependencies) {
      uniqueClassDependencies.addDependency(dependency);
    }
  };
}
