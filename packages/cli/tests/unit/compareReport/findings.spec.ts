import { Event, Metadata } from '@appland/models';
import ChangeReport, {
  AppMap,
  FindingChange,
  FindingDiff,
} from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection, { Section } from '../../../src/cmds/compare-report/ReportSection';
import { reportOptions } from './testHelper';

let resolvedFinding: FindingChange;

describe('findings', () => {
  let section: ReportSection;

  beforeAll(async () => (section = await ReportSection.build(Section.PerformanceProblems)));

  describe('when there are no changes', () => {
    const findingDiff = new FindingDiff([], []);

    describe('header', () => {
      it('reports all passed', async () => {
        const report = section.generateHeading({
          findingDiff,
        } as unknown as ChangeReport);
        expect(report).toEqual('| Performance problems |  :white_check_mark: None detected  |');
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails(
          {
            findingDiff,
          } as unknown as ChangeReport,
          reportOptions
        );

        expect(report).toEqual(``);
      });
    });
  });

  describe('when the findingDiff is not present', () => {
    describe('header', () => {
      it('is blank', async () => {
        const report = section.generateHeading({} as unknown as ChangeReport);
        expect(report).toEqual('');
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails({} as unknown as ChangeReport, reportOptions);

        expect(report).toEqual(``);
      });
    });
  });

  describe('when there is a resolved finding', () => {
    let findingDiff: FindingDiff;

    beforeAll(() => (findingDiff = new FindingDiff([], [resolvedFinding])));

    describe('header', () => {
      it('reports the change', async () => {
        const report = section.generateHeading({
          findingDiff,
        } as unknown as ChangeReport);
        expect(report).toEqual(
          '| [Performance problems](#performance-problems) |  :tada: 1 resolved  |'
        );
      });
    });
    describe('details', () => {
      it('reports the change', async () => {
        const report = section.generateDetails(
          {
            findingDiff,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(`<h2 id="performance-problems">Performance problems</h2>

### :tada: Problems resolved (1)


<details>
<summary>
  N plus 1 SQL query
</summary>


##### Description

> app_views_shared__feed_html_erb.render[418] contains 30 occurrences of SQL: SELECT &quot;users&quot;.* FROM &quot;users&quot; WHERE &quot;users&quot;.&quot;id&quot; &#x3D; ? LIMIT ?

| Field | Value |
| --- | --- |
| Rule | [n-plus-one-query](https://appmap.io/docs/analysis/rules-reference.html#n-plus-one-query) |
| Impact domain | Performance |

##### View in AppMap

- [Full AppMap &raquo;](https://getappmap.com/?path=head%2Fminitest%2FMicroposts_interface_micropost_interface.appmap.json&state=eyJzZWxlY3RlZE9iamVjdCI6ImFuYWx5c2lzLWZpbmRpbmc6YzdhNDk0OWY1NTNjMTcyYWIxYTFmYjJjNTdiMWE1YjVhNjFjZDk5ODAzOTA5MzM2NTVkNDI3NmE4ZGY0ZTc0MCJ9)
- [Sequence diagram diff &raquo;](https://getappmap.com/?path=diff%2Fminitest%2FMicroposts_interface_micropost_interface.diff.sequence.json)


##### Related code changes

\`\`\`diff
--- spec/controllers/users_controller_test.rb
+++ spec/controllers/users_controller_test.rb
@@ -10,6 +10,7 @@ class UsersControllerTest < ActionDispatch::IntegrationTest

\`\`\`

##### Stack trace

- [\`app/helpers/sessions_helper.rb:19\`](app/helpers/sessions_helper.rb#L19)
- [\`app/helpers/sessions_helper.rb:35\`](app/helpers/sessions_helper.rb#L35)
- [\`app/views/shared/_feed.html.erb\`](app/views/shared/_feed.html.erb)
- [\`app/views/static_pages/home.html.erb\`](app/views/static_pages/home.html.erb)
- \`/home/myself/.rbenv/versions/3.1.2/lib/ruby/gems/3.1.0/gems/actionpack-7.0.4/lib/action_controller/metal/renderers.rb:140\`


</details>
`);
      });
    });
  });
});

const appmapMetadata: Metadata = {
  name: 'Microposts interface micropost interface',
  client: {} as any,
  recorder: {} as any,
  exception: {} as any,
  source_location: 'test/integration/microposts_interface_test.rb:10',
  test_status: 'succeeded',
};

const sourceDiff = `--- spec/controllers/users_controller_test.rb
+++ spec/controllers/users_controller_test.rb
@@ -10,6 +10,7 @@ class UsersControllerTest < ActionDispatch::IntegrationTest
`;

const Microposts_interface_micropost_interface: AppMap = new AppMap(
  'minitest/Microposts_interface_micropost_interface',
  appmapMetadata,
  true,
  sourceDiff
);

resolvedFinding = {
  appmap: Microposts_interface_micropost_interface,
  finding: {
    appMapFile: 'minitest/Microposts_interface_micropost_interface.appmap.json',
    checkId: 'n-plus-one-query',
    ruleId: 'n-plus-one-query',
    ruleTitle: 'N plus 1 SQL query',
    event: {
      id: 461,
      event: 'call',
      thread_id: 4320,
      sql_query: {
        sql: 'SELECT "users".* FROM "users" WHERE "users"."id" = ? LIMIT ?',
        database_type: 'sqlite',
      },
    } as unknown as Event, // TODO: The type here is not working properly
    hash: '3f613b50dced1e74470e192f080e31374e00520c812945de867da4fcd8e09c65',
    hash_v2: 'c7a4949f553c172ab1a1fb2c57b1a5b5a61cd9980390933655d4276a8df4e740',
    stack: [
      'app/helpers/sessions_helper.rb:19',
      'app/helpers/sessions_helper.rb:35',
      'app/views/shared/_feed.html.erb',
      'app/views/static_pages/home.html.erb',
      '/home/myself/.rbenv/versions/3.1.2/lib/ruby/gems/3.1.0/gems/actionpack-7.0.4/lib/action_controller/metal/renderers.rb:140',
    ],
    scope: {
      id: 187,
      event: 'call',
      thread_id: 4320,
      http_server_request: {
        request_method: 'GET',
        path_info: '/',
        normalized_path_info: '',
        headers: {
          Version: 'HTTP/1.0',
          Host: 'www.example.com',
          Accept:
            'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
          Cookie:
            '_sample_app_session=6CeFie7CNS8WspRw42iIz%2Fk6mvKVmiSYz8RvRYftsTFMz8MV42M6sYVO9O%2Fs3dH%2BL8OgKBu1a2Me79wpVmtlMEyZpcT9bvzObdrfiUWc1t2yq9T%2BBoK%2F7Zfbm%2Fery4AOz0NUJMi%2BZ6rCzxHwuvuktuVzk%2BQtlnXM1uMLUIcnXZm%2Fp8E7Dcam2rcuYI%2FDKb5bnb2A5pcq4kgMhHYrMj6n9nseuezU%2FpDQhOw%2BhySCBq6C4meLv0RcjtqU8WK%2B%2BWigKfwo8CRE11cgfQLt0Lvc8lsf%2BI0x%2BfVY9zKP3ofx3AttjGzUAogrTNoKqd6imxGLKwDmkVuoY1Jtz1SGUoHfKobeF9ayKIISZZCiQIjISQ%3D%3D--QVzW2pdZ6iN5B775--%2Fjt8qJbUeh3x8uuC8DNSUA%3D%3D; remember_token=blQrw0SzV5kd-eW9T9L_oA; user_id=vjulihvhC5fecCNeGb0%2FoIPkJTfQbw4E2pw6TIHsafbOIunleIChE2RU9Irjrd%2BAvQRYvQ%2FFmzIksYPf5HbX%2BqYjj6vfQEg%3D--ouR9ESgJ14T6YdmY--YUnzQ8SddGCQYDJgkUYEVg%3D%3D',
          'Content-Length': '0',
        },
      },
    } as unknown as Event,
    message:
      'app_views_shared__feed_html_erb.render[418] contains 30 occurrences of SQL: SELECT "users".* FROM "users" WHERE "users"."id" = ? LIMIT ?',
    groupMessage: 'SELECT "users".* FROM "users" WHERE "users"."id" = ? LIMIT ?',
    occurranceCount: 30,
    impactDomain: 'Performance',
  },
};
