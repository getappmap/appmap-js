export default function isPrecomputedSequenceDiagram() {
  // Standalone sequence diagram does not use a $store
  if (this.$store === undefined) return false;

  return !!this.$store.state.precomputedSequenceDiagram;
}
