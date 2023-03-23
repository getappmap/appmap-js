import { createHash } from 'crypto';
import { RevisionName } from './RevisionName';
import { loadSequenceDiagram } from './buildChangeReport';
import { AppMapData } from './AppMapData';

export class SequenceDiagramDigest {
  constructor(
    public appmapData: AppMapData,
    public revisionName: RevisionName,
    public appmap: string
  ) {}

  async digest() {
    const digest = createHash('sha256');
    const diagram = await loadSequenceDiagram(
      this.appmapData.sequenceDiagramPath(this.revisionName, this.appmap)
    );
    diagram.rootActions.forEach((action) => digest.update(action.subtreeDigest));
    return digest.digest('hex');
  }
}
