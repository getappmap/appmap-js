import { Event } from '@appland/models';
import Check from '../../src/check';
import rule from '../../src/rules/slowFunctionCall';
import { scan } from '../util';

it('slow function call', async () => {
  const check = new Check(rule);
  check.options.timeAllowed = 0.2;
  const pattern = new RegExp(/Controller#create$/);
  check.includeEvent = [(event: Event) => pattern.test(event.codeObject.fqid)];

  const findings = await scan(check, 'Microposts_interface_micropost_interface.appmap.json');
  expect(findings).toHaveLength(1);
  const finding = findings[0];
  expect(finding.ruleId).toEqual('slow-function-call');
  expect(finding.event.id).toEqual(897);
  expect(finding.message).toEqual(
    'Slow app/controllers/MicropostsController#create call (0.228481ms)'
  );
});
