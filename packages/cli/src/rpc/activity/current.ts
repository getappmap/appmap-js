import { ActivityRpc } from '@appland/rpc';
import { computeDiffDigest, getChangeDiffs } from '../navie/get-change-diffs';
import configuration from '../configuration';

class Activity {
  private activity: ActivityRpc.V1.Current.Response | undefined;

  setActivity(activity: ActivityRpc.V1.Current.Response) {
    this.activity = activity;
  }

  currentActivity(): ActivityRpc.V1.Current.Response | undefined {
    if (!this.matchesProjectDirectories()) {
      this.activity = undefined;
    }

    return this.activity;
  }

  protected matchesProjectDirectories(): boolean {
    if (!this.activity) return false;

    const configuredDirectories = configuration()?.projectDirectories ?? [];
    const activityDirectories = this.activity.projectStates.map((state) => state.projectDirectory);
    return configuredDirectories.join('\n') === activityDirectories.join('\n');
  }

  static create(): Activity {
    return new Activity();
  }
}

const ACTIVITY = Activity.create();

export async function computeCurrentActivity(): Promise<ActivityRpc.V1.Current.Response> {
  const projectDirectories = configuration()?.projectDirectories ?? [];
  const responseDiffs = await getChangeDiffs(projectDirectories);
  const responseDigest = computeDiffDigest(projectDirectories, responseDiffs);

  const projectStates = new Array<ActivityRpc.V1.Current.ProjectState>();
  for (const projectDirectory of projectDirectories) {
    const projectDiffs = await getChangeDiffs([projectDirectory]);

    const projectState: ActivityRpc.V1.Current.ProjectState = {
      projectDirectory,
      // TODO: Fill in with real data
      commit: 'HEAD',
      branch: 'main',
      baseBranch: 'main',
      diffs: projectDiffs,
      diffDigest: computeDiffDigest([projectDirectory], projectDiffs),
    };
    projectStates.push(projectState);
  }

  return {
    name: 'current',
    title: 'Current Activity',
    description: 'No activity detected',
    projectStates,
    digest: responseDigest,
  };
}

export async function currentActivity(): Promise<ActivityRpc.V1.Current.Response> {
  const projectDirectories = configuration()?.projectDirectories ?? [];
  const diff = await getChangeDiffs(projectDirectories);
  const digest = computeDiffDigest(projectDirectories, diff);

  let activity = ACTIVITY.currentActivity();
  if (activity && activity.digest === digest) return activity;

  activity = await computeCurrentActivity();
  ACTIVITY.setActivity(activity);

  return activity;
}
