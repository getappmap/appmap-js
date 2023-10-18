import { rm } from 'fs/promises';
import { Paths } from '../../diffArchive/Paths';
import { RevisionName } from '../../diffArchive/RevisionName';
import { verbose } from '../../utils';
import { AppMapName } from './ChangeReport';
import { mutedStyle } from './ui';
import { warn } from 'console';

export default async function deleteUnreferencedAppMaps(
  paths: Paths,
  referencedAppMaps: (revisionName: RevisionName, appmap: AppMapName) => boolean
) {
  const deleteAppMap = async (revisionName: RevisionName, appmap: AppMapName) => {
    if (verbose())
      console.log(
        mutedStyle(`AppMap ${revisionName}/${appmap} is unreferenced so it will be deleted.`)
      );
    const appmapPath = paths.appmapPath(revisionName, appmap);
    const appmapIndexDir = appmapPath.slice(0, -'.appmap.json'.length);
    await rm(appmapPath);
    await rm(appmapIndexDir, { recursive: true });
  };

  for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
    for (const appmap of await paths.appmaps(revisionName)) {
      if (!referencedAppMaps(revisionName, appmap))
        try {
          await deleteAppMap(revisionName, appmap);
        } catch (err) {
          warn(`Failed to delete unreferenced AppMap ${revisionName}/${appmap}. Will continue...`);
        }
    }
  }
}
