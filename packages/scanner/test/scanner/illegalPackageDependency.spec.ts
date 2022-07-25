import HashV2 from '../../src/algorithms/hash/hashV2';
import Check from '../../src/check';
import MatchPatternConfig from '../../src/configuration/types/matchPatternConfig';
import rule from '../../src/rules/illegalPackageDependency';
import { scan } from '../util';

it('illegal package dependency', async () => {
  const options = new rule.Options();
  options.callerPackages = [
    { equal: 'lib/pkg_a' } as MatchPatternConfig,
    { equal: 'lib/command' } as MatchPatternConfig,
  ];
  options.calleePackages = [{ equal: 'lib/pkg_b' } as MatchPatternConfig];
  const { appMap, findings } = await scan(
    new Check(rule, options),
    'ruby/circular_dependency/tmp/appmap/minitest/Command_command.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  const findingEvent = appMap.events.find((e) => e.id === finding.event.id)!;
  expect(
    new HashV2(finding.ruleId, findingEvent, finding.participatingEvents || {}).canonicalString
  ).toEqual(`rule=illegal-package-dependency
rootEvent.event_type=function
rootEvent.id=Command.invoke
rootEvent.raises_exception=false
findingEvent.event_type=function
findingEvent.id=PkgA::A#cycle
findingEvent.raises_exception=false
participatingEvent.parent.event_type=function
participatingEvent.parent.id=PkgB::B#invoke
participatingEvent.parent.raises_exception=false`);
  expect(finding.ruleId).toEqual('illegal-package-dependency');
  expect(finding.event.id).toEqual(4);
  expect(finding.message).toEqual(
    `Code object lib/pkg_a/PkgA::A#cycle was invoked from lib/pkg_b, not from lib/pkg_a or lib/command`
  );
});
