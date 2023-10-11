import { Metadata } from '@appland/models';
import ChangeReport, { AppMap } from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection, { Section } from '../../../src/cmds/compare-report/ReportSection';
import { reportOptions } from './testHelper';

describe('removedAppMaps', () => {
  let section: ReportSection;

  beforeAll(async () => (section = await ReportSection.build(Section.RemovedAppMaps)));

  describe('when there are no changes', () => {
    const removedAppMaps: AppMap[] = [];

    describe('header', () => {
      it('reports all passed', async () => {
        const report = section.generateHeading(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        // This section is not rendered if no AppMaps are removed.
        expect(report).toEqual('');
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );

        expect(report).toEqual(``);
      });
    });
  });
  describe('when there is a removed AppMap', () => {
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: { name: 'rspec', type: 'tests' } as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const appmap = new AppMap('minitest/users_controller_test', metadata, false, undefined);
    const removedAppMaps = [appmap];

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [Removed AppMaps](#removed-appmaps) | :heavy_multiplication_x: 1 removed rspec test |'
        );
      });
    });
    describe('details', () => {
      it('are provided', () => {
        const report = section.generateDetails(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(`<h2 id=\"removed-appmaps\">✖️ Removed AppMaps</h2>

- [[rspec] Users controller test](https://getappmap.com/?path=base%2Fminitest%2Fusers_controller_test.appmap.json)

`);
      });
    });
  });
  describe('when there are many removed AppMaps', () => {
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
    const removedAppMaps = [appmap1, appmap2, appmap3];

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [Removed AppMaps](#removed-appmaps) | :heavy_multiplication_x: 2 removed rspec, 1 removed minitest |'
        );
      });
    });
    describe('details', () => {
      it('are limited', () => {
        const report = section.generateDetails(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          { ...reportOptions, ...{ maxElements: 2 } }
        );
        expect(report).toEqual(`<h2 id=\"removed-appmaps\">✖️ Removed AppMaps</h2>

- [[rspec] Users controller test](https://getappmap.com/?path=base%2Fminitest%2Fusers_controller_test.appmap.json)


- [[rspec] Users controller test](https://getappmap.com/?path=base%2Fminitest%2Fusers_controller_test.appmap.json)

Because there are so many removed AppMaps, some of them are not listed in this report.
`);
      });
    });
  });
});
