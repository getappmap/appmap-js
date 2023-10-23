import DependencyMap from '../DependencyMap';
import readIndexFile from '../readIndexFile';

export function collectPackageDependencies(uniquePackageDependencies: DependencyMap) {
  return async (appmap: string) => {
    const packageDependencies = await readIndexFile(appmap, 'canonical.packageDependencies.json');
    for (const dependency of packageDependencies) {
      uniquePackageDependencies.addDependency(dependency);
    }
  };
}
