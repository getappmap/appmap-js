import { createHash } from 'crypto';
import { RevisionName } from './RevisionName';
import { Paths } from './Paths';
import { loadSequenceDiagram } from './loadSequenceDiagram';

export class SequenceDiagramDigest {
  constructor(public paths: Paths, public revisionName: RevisionName, public appmap: string) {}

  async digest() {
    const digest = createHash('sha256');
    const diagram = await loadSequenceDiagram(
      this.paths.sequenceDiagramPath(this.revisionName, this.appmap)
    );
    diagram.rootActions.forEach((action) => digest.update(action.subtreeDigest));
    return digest.digest('hex');
  }
}
