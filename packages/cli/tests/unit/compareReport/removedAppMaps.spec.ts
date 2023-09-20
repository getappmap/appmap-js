import { Metadata } from '@appland/models';
import ChangeReport, { AppMap } from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection, { Section } from '../../../src/cmds/compare-report/ReportSection';
import { reportOptions } from './testHelper';

describe('newAppMaps', () => {
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
  describe('when there is a new AppMap', () => {
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: { name: 'rspec' } as any,
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
          '| [Removed AppMaps](#removed-appmaps) | :heavy_multiplication_x: 1 removed |'
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
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: { name: 'rspec' } as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const appmap = new AppMap('minitest/users_controller_test', metadata, false, undefined);
    const removedAppMaps = [appmap, appmap, appmap, appmap, appmap];

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [Removed AppMaps](#removed-appmaps) | :heavy_multiplication_x: 5 removed |'
        );
      });
    });
    describe('details', () => {
      it('are limited', () => {
        const report = section.generateDetails(
          {
            removedAppMaps,
          } as unknown as ChangeReport,
          { ...reportOptions, ...{ maxElements: 3 } }
        );
        expect(report).toEqual(`<h2 id=\"removed-appmaps\">✖️ Removed AppMaps</h2>

- [[rspec] Users controller test](https://getappmap.com/?path=base%2Fminitest%2Fusers_controller_test.appmap.json)


- [[rspec] Users controller test](https://getappmap.com/?path=base%2Fminitest%2Fusers_controller_test.appmap.json)


- [[rspec] Users controller test](https://getappmap.com/?path=base%2Fminitest%2Fusers_controller_test.appmap.json)

Because there are so many removed AppMaps, some of them are not listed in this report.
`);
      });
    });
  });
});
