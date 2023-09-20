import { Metadata } from '@appland/models';
import ChangeReport, { AppMap } from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection, {
  ExperimentalSection,
  Section,
} from '../../../src/cmds/compare-report/ReportSection';
import { reportOptions } from './testHelper';

describe('changedAppMaps', () => {
  let section: ReportSection;

  beforeAll(async () => (section = await ReportSection.build(ExperimentalSection.ChangedAppMaps)));

  describe('when there are no changes', () => {
    const changedAppMaps = {};

    describe('header', () => {
      it('reports all passed', async () => {
        const report = section.generateHeading(
          {
            changedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [Changed AppMaps](#changed-appmaps) |  :white_check_mark: No changes  |'
        );
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails(
          {
            changedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );

        expect(report).toEqual(``);
      });
    });
  });
  describe('when there is a changed AppMap', () => {
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: {} as any,
      exception: {} as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const appmap = new AppMap('minitest/users_controller_test', metadata, false, undefined);
    const changedAppMaps = {
      'appmap behavior has changed': [appmap],
    };

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading(
          {
            changedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [Changed AppMaps](#changed-appmaps) |  :twisted_rightwards_arrows: 1 changes  |'
        );
      });
    });
    describe('details', () => {
      it('are provided', () => {
        const report = section.generateDetails(
          {
            changedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(`<h2 id="changed-appmaps">🔀 Changed AppMaps</h2>

<details>

<summary>
Review changes
</summary>


\`\`\`
appmap behavior has changed
\`\`\`

- [Users controller test](https://getappmap.com/?path=diff%2Fminitest%2Fusers_controller_test.diff.sequence.json)

</details>
`);
      });
    });
  });
  describe('when there are many changes', () => {
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: {} as any,
      exception: {} as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
    };
    const appmap = new AppMap('minitest/users_controller_test', metadata, false, undefined);
    const changedAppMaps = {
      'changed 1': [appmap],
      'changed 2': [appmap],
      'changed 3': [appmap],
      'changed 4': [appmap],
      'changed 5': [appmap],
      'changed 6': [appmap],
    };

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading(
          {
            changedAppMaps,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [Changed AppMaps](#changed-appmaps) |  :twisted_rightwards_arrows: 6 changes  |'
        );
      });
    });
    describe('details', () => {
      it('are limited', () => {
        const report = section.generateDetails(
          {
            changedAppMaps,
          } as unknown as ChangeReport,
          { ...reportOptions, ...{ maxElements: 3 } }
        );
        expect(report).toEqual(`<h2 id="changed-appmaps">🔀 Changed AppMaps</h2>

<details>

<summary>
Review changes
</summary>


\`\`\`
changed 1
\`\`\`

- [Users controller test](https://getappmap.com/?path=diff%2Fminitest%2Fusers_controller_test.diff.sequence.json)

\`\`\`
changed 2
\`\`\`

- [Users controller test](https://getappmap.com/?path=diff%2Fminitest%2Fusers_controller_test.diff.sequence.json)

\`\`\`
changed 3
\`\`\`

- [Users controller test](https://getappmap.com/?path=diff%2Fminitest%2Fusers_controller_test.diff.sequence.json)

Because there are so many changed AppMaps, some of them are not listed in this report.
</details>
`);
      });
    });
  });
});
