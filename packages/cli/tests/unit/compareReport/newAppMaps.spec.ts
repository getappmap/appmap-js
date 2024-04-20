import { Metadata } from '@appland/models';
import ChangeReport, { AppMap } from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection, { Section } from '../../../src/cmds/compare-report/ReportSection';
import { reportOptions } from './testHelper';

describe('newAppMaps', () => {
  let section: ReportSection;

  beforeAll(async () => (section = await ReportSection.build(Section.NewAppMaps)));

  describe('when there are no changes', () => {
    const newAppMaps: AppMap[] = [];

    describe('header', () => {
      it('reports all passed', async () => {
        const report = section.generateHeading({
          newAppMaps,
        } as unknown as ChangeReport);
        expect(report).toEqual('| New AppMaps | :zero: No new AppMaps |');
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails(
          {
            newAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );

        expect(report).toEqual(``);
      });
    });
  });
  describe('when there is a new AppMap', () => {
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: { name: 'rspec', type: 'tests' } as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const appmap = new AppMap('minitest/users_controller_test', metadata, false, undefined);
    const newAppMaps = [appmap];

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading({
          newAppMaps,
        } as unknown as ChangeReport);
        expect(report).toEqual('| [New AppMaps](#new-appmaps) | :star: 1 new rspec test |');
      });
    });
    describe('details', () => {
      it('are provided', () => {
        const report = section.generateDetails(
          {
            newAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(`<h2 id="new-appmaps">⭐ New AppMaps</h2>


[[rspec] Users controller test](https://getappmap.com/?path=head%2Fminitest%2Fusers_controller_test.appmap.json) from [\`spec/controllers/users_controller_test.rb:10\`](spec/controllers/users_controller_test.rb#L10)
`);
      });
    });
  });
  describe('when there are multiple new AppMaps', () => {
    const metadata1: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: { name: 'rspec' } as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const metadata2: Metadata = {
      name: 'Sessions controller test',
      client: {} as any,
      recorder: { name: 'minitest' } as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const appmap1 = new AppMap('minitest/users_controller_test', metadata1, false, undefined);
    const appmap2 = new AppMap('minitest/users_controller_test', metadata1, false, undefined);
    const appmap3 = new AppMap('minitest/users_controller_test', metadata2, false, undefined);
    const newAppMaps = [appmap1, appmap2, appmap3];

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading({
          newAppMaps,
        } as unknown as ChangeReport);
        expect(report).toEqual(
          '| [New AppMaps](#new-appmaps) | :star: 2 new rspec, 1 new minitest |'
        );
      });
    });
    describe('details', () => {
      it('are limited', () => {
        const report = section.generateDetails(
          {
            newAppMaps,
          } as unknown as ChangeReport,
          { ...reportOptions, ...{ maxElements: 2 } }
        );
        expect(report).toEqual(`<h2 id="new-appmaps">⭐ New AppMaps</h2>


[[rspec] Users controller test](https://getappmap.com/?path=head%2Fminitest%2Fusers_controller_test.appmap.json) from [\`spec/controllers/users_controller_test.rb:10\`](spec/controllers/users_controller_test.rb#L10)

[[rspec] Users controller test](https://getappmap.com/?path=head%2Fminitest%2Fusers_controller_test.appmap.json) from [\`spec/controllers/users_controller_test.rb:10\`](spec/controllers/users_controller_test.rb#L10)

Because there are many new AppMaps, some of them are not listed in this report.
`);
      });
    });
  });
});
