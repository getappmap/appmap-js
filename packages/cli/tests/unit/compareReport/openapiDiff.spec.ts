import ChangeReport, { OpenAPIDiff } from '../../../src/cmds/compare-report/ChangeReport';
import ReportSection from '../../../src/cmds/compare-report/ReportSection';
import { reportOptions } from './testHelper';

describe('openapiDiff', () => {
  let section: ReportSection;

  beforeAll(async () => (section = await ReportSection.build('openapi-diff')));

  describe('when there are no changes', () => {
    const openapiDiff = new OpenAPIDiff(0, {});

    describe('header', () => {
      it('reports all passed', async () => {
        const report = section.generateHeading(
          {
            openapiDiff,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [API changes](#api-changes) |  :white_check_mark: No API changes |'
        );
      });
    });
    describe('details', () => {
      it('are blank', () => {
        const report = section.generateDetails(
          {
            openapiDiff,
          } as unknown as ChangeReport,
          reportOptions
        );

        expect(report).toEqual(``);
      });
    });
  });

  describe('when there are changes', () => {
    const sourceDiff = `--- base/openapi.yml    2023-08-31 13:25:30.000000000 -0400
    +++ head/openapi.yml    2023-08-31 13:25:30.000000000 -0400
    @@ -100,18 +100,9 @@
        /microposts:
          post:
            responses:
    -        '302':
    -          content:
    -            text/html: {}
    -          description: Found
    -        '303':
    -          content:
    -            text/html: {}
    -          description: See Other
    -        '422':
    -          content:
    -            text/html: {}
    -          description: Unprocessable Entity
    +        '200':
    +          content: {}
    +          description: OK
            requestBody:
              content:
                application/x-www-form-urlencoded:
    @@ -123,13 +114,6 @@
                        properties:
                          content:
                            type: string
    -  /microposts/{id}:
    -    delete:
    -      responses:
    -        '303':
    -          content:
    -            text/html: {}
    -          description: See Other
        /password_resets:
          post:
            responses:`;

    const openapiDiff = new OpenAPIDiff(
      2,
      {
        breakingDifferences: [
          {
            type: 'breaking',
            action: 'remove',
            code: 'path.remove',
            destinationSpecEntityDetails: [],
            entity: 'path',
            source: 'openapi-diff',
            sourceSpecEntityDetails: [
              {
                location: '/microposts/{id}',
                value: {
                  delete: {
                    responses: {
                      '303': {
                        content: {
                          'text/html': {},
                        },
                        description: 'See Other',
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            type: 'breaking',
            action: 'remove',
            code: 'response.status-code.remove',
            destinationSpecEntityDetails: [],
            entity: 'response.status-code',
            source: 'openapi-diff',
            sourceSpecEntityDetails: [
              {
                location: '302 POST /microposts',
                value: {
                  content: {
                    'text/html': {},
                  },
                  description: 'Found',
                },
              },
            ],
          },
          {
            type: 'breaking',
            action: 'remove',
            code: 'response.status-code.remove',
            destinationSpecEntityDetails: [],
            entity: 'response.status-code',
            source: 'openapi-diff',
            sourceSpecEntityDetails: [
              {
                location: '303 POST /microposts',
                value: {
                  content: {
                    'text/html': {},
                  },
                  description: 'See Other',
                },
              },
            ],
          },
          {
            type: 'breaking',
            action: 'remove',
            code: 'response.status-code.remove',
            destinationSpecEntityDetails: [],
            entity: 'response.status-code',
            source: 'openapi-diff',
            sourceSpecEntityDetails: [
              {
                location: '422 POST /microposts',
                value: {
                  content: {
                    'text/html': {},
                  },
                  description: 'Unprocessable Entity',
                },
              },
            ],
          },
        ],
        breakingDifferencesFound: true,
        nonBreakingDifferences: [
          {
            type: 'non-breaking',
            action: 'add',
            code: 'response.status-code.add',
            destinationSpecEntityDetails: [
              {
                location: '200 POST /microposts',
                value: {
                  content: {},
                  description: 'OK',
                },
              },
            ],
            entity: 'response.status-code',
            source: 'openapi-diff',
            sourceSpecEntityDetails: [],
          },
        ],
        unclassifiedDifferences: [],
      },
      sourceDiff
    );

    describe('header', () => {
      it('reports the changes', async () => {
        const report = section.generateHeading(
          {
            openapiDiff,
          } as unknown as ChangeReport,
          reportOptions
        );
        expect(report).toEqual(
          '| [API changes](#api-changes) | 🚧 4 breaking,&nbsp; :wrench: 1 non-breaking |'
        );
      });
    });
    describe('details', () => {
      it('are provided', () => {
        const report = section.generateDetails(
          {
            openapiDiff,
          } as unknown as ChangeReport,
          reportOptions
        );

        expect(report).toEqual(`## 🔄 API changes

### 🚧 Breaking changes

- Remove path \`/microposts/{id}\` 
- Remove response status code \`302 POST /microposts\` 
- Remove response status code \`303 POST /microposts\` 
- Remove response status code \`422 POST /microposts\` 

### :wrench: Non-breaking changes

- Add response status code  \`200 POST /microposts\`


<details>
<summary>
Detailed OpenAPI diff
</summary>

\`\`\`diff
--- base/openapi.yml    2023-08-31 13:25:30.000000000 -0400
    +++ head/openapi.yml    2023-08-31 13:25:30.000000000 -0400
    @@ -100,18 +100,9 @@
        /microposts:
          post:
            responses:
    -        '302':
    -          content:
    -            text/html: {}
    -          description: Found
    -        '303':
    -          content:
    -            text/html: {}
    -          description: See Other
    -        '422':
    -          content:
    -            text/html: {}
    -          description: Unprocessable Entity
    +        '200':
    +          content: {}
    +          description: OK
            requestBody:
              content:
                application/x-www-form-urlencoded:
    @@ -123,13 +114,6 @@
                        properties:
                          content:
                            type: string
    -  /microposts/{id}:
    -    delete:
    -      responses:
    -        '303':
    -          content:
    -            text/html: {}
    -          description: See Other
        /password_resets:
          post:
            responses:
\`\`\`
</details>
`);
      });
    });
  });
});
