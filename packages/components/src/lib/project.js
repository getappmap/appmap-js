export function isFeatureSupported(feature) {
  return feature && feature.score > 0;
}

export function isProjectSupported(project) {
  return project && project.score > 0;
}
