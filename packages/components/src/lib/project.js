export function isFeatureSupported(feature) {
  if (!feature || !feature.score || !Number.isInteger(feature.score)) return false;
  return feature.score > 0;
}

export function isProjectSupported(project) {
  if (!project || !Number.isInteger(project.score)) return false;
  return isFeatureSupported(project.webFramework) || isFeatureSupported(project.testFramework);
}
