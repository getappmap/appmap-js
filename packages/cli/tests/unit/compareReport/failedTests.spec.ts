import { Metadata } from '@appland/models';
import ChangeReport, { AppMap, TestFailure } from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection, { Section } from '../../../src/cmds/compare-report/ReportSection';
import { normalizeReport, reportOptions } from './testHelper';

describe('failedTests', () => {
  let section: ReportSection;

  beforeAll(async () => (section = await ReportSection.build(Section.FailedTests)));

  describe('when all passed', () => {
    describe('header', () => {
      it('reports all passed', async () => {
        const report = section.generateHeading(
          {
            testFailures: [],
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| Failed tests | :white_check_mark: All tests passed |'
        );
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails(
          {
            testFailures: [],
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(``);
      });
    });
  });
  describe('with a failure', () => {
    const metadata: Metadata = {
      name: 'Users controller test',
      client: {} as any,
      recorder: {} as any,
      exception: {} as any,
      source_location: 'spec/controllers/users_controller_test.rb:10',
      test_status: 'failed',
      test_failure: {
        message: 'Expected response to be a <3XX: redirect>, but was a <200: OK>',
        location: 'spec/controllers/users_controller_test.rb:10',
      },
    };
    const sourceDiff = `--- spec/controllers/users_controller_test.rb
+++ spec/controllers/users_controller_test.rb
@@ -10,6 +10,7 @@ class UsersControllerTest < ActionDispatch::IntegrationTest
`;
    const appmap = new AppMap('minitest/users_controller_test', metadata, true, sourceDiff);
    const testSnippet = {
      codeFragment: '  def test_index\n    get users_url\n    assert_response :success\n  end',
      language: 'ruby',
      startLine: 10,
    };
    const testFailure = new TestFailure(appmap, testSnippet);

    describe('header', () => {
      it('reports 1 failed', async () => {
        const report = section.generateHeading(
          {
            testFailures: [testFailure],
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual('| [Failed tests](#failed-tests) | :warning: 1 failed |');
      });
    });
    describe('details', () => {
      it('reports the failure', async () => {
        const report = section.generateDetails(
          {
            testFailures: [testFailure],
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(normalizeReport(report)).toEqual(
          normalizeReport(`<h2 id="failed-tests">⚠️ Failed tests</h2>

<details>
<summary>
spec/controllers/users_controller_test.rb:10
</summary>

<p/>

<!-- testLocation -->
[spec/controllers/users_controller_test.rb:10](spec/controllers/users_controller_test.rb#L10) failed with error:

<!-- failureMessage -->
\`\`\`
Expected response to be a <3XX: redirect>, but was a <200: OK>
\`\`\`

<!-- failureLocation -->
The error occurred at [spec/controllers/users_controller_test.rb:10](spec/controllers/users_controller_test.rb#L10):

<!-- testSnippet -->
\`\`\`ruby
>  10:   def test_index
11:     get users_url
12:     assert_response :success
13:   end
\`\`\`

<!-- sourceDiff -->
##### Related code changes

\`\`\`diff
--- spec/controllers/users_controller_test.rb
+++ spec/controllers/users_controller_test.rb
@@ -10,6 +10,7 @@ class UsersControllerTest < ActionDispatch::IntegrationTest

\`\`\`

[View AppMap of this test &raquo;](https://getappmap.com/?path=head%2Fminitest%2Fusers_controller_test.appmap.json)
[View sequence diagram diff of this test &raquo;](https://getappmap.com/?path=diff%2Fminitest%2Fusers_controller_test.diff.sequence.json)

<hr/>
</details>

`)
        );
      });
    });
  });
});
