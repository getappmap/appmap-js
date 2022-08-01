import HashV2 from '../../src/algorithms/hash/hashV2';
import Check from '../../src/check';
import MatchPatternConfig from '../../src/configuration/types/matchPatternConfig';
import rule from '../../src/rules/illegalPackageDependency';
import { scan } from '../util';

it('illegal package dependency', async () => {
  const options = new rule.Options();
  options.callerPackages = [
    { equal: 'lib/circular/pkg_a' } as MatchPatternConfig,
    { equal: 'lib/circular' } as MatchPatternConfig,
  ];
  options.calleePackages = [{ equal: 'lib/circular/pkg_b' } as MatchPatternConfig];
  const { appMap, findings } = await scan(
    new Check(rule, options),
    'ruby/fixture/tmp/appmap/minitest/Circular_cycle.appmap.json'
  );
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  const findingEvent = appMap.events.find((e) => e.id === finding.event.id)!;
  expect(
    new HashV2(finding.ruleId, findingEvent, finding.participatingEvents || {}).canonicalString
  ).toEqual(`algorithmVersion=2
rule=illegal-package-dependency
findingEvent.event_type=function
findingEvent.id=PkgA::A#cycle
findingEvent.raises_exception=false
participatingEvent.parent.event_type=function
participatingEvent.parent.id=PkgB::B#invoke
participatingEvent.parent.raises_exception=false
stack[1].event_type=function
stack[1].id=PkgB::B#invoke
stack[1].raises_exception=false
stack[2].event_type=function
stack[2].id=PkgA::A#invoke
stack[2].raises_exception=false
stack[3].event_type=function
stack[3].id=Circular::Command.invoke
stack[3].raises_exception=false`);
  expect(finding.ruleId).toEqual('illegal-package-dependency');
  expect(finding.event.id).toEqual(4);
  expect(finding.message).toEqual(
    `Code object lib/circular/pkg_a/PkgA::A#cycle was invoked from lib/circular/pkg_b, not from lib/circular/pkg_a or lib/circular`
  );
});
