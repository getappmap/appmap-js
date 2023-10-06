import { Dependency } from './Report';

export default class DependencyMap {
  private uniqueDependencies = new Set<string>();
  public dependencies: Dependency[] = [];

  addDependency(dependency: Dependency) {
    const { caller, callee } = dependency;
    const dependencyStr = `${caller} -> ${callee}`;
    if (!this.uniqueDependencies.has(dependencyStr)) {
      this.uniqueDependencies.add(dependencyStr);
      this.dependencies.push(dependency);
    }
  }
}
