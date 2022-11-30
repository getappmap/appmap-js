import VFindingDetails from '@/pages/FindingDetails.vue';

export default {
  title: 'Pages/VS Code/Finding details',
  component: VFindingDetails,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VFindingDetails },
  template: '<v-finding-details v-bind="$props" />',
});

export const WithNoData = Template.bind({});
WithNoData.args = {};

export const WithTwoFindings = Template.bind({});
WithTwoFindings.args = {
  findings: [
    {
      finding: {
        ruleId: 'deserialization-of-untrusted-data',
        appMapFile:
          '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_resets.appmap.json',
        hash_v2: '5029373729e1556d3596a2cd5696dfd928e5607f86cc2f1f81a937a1623e2f40',
        impactDomain: 'Security',
        ruleTitle: 'Deserialization of untrusted data',
        message:
          'deserializes untrusted data: ---\noperation: reset\nsecret: !binary |-\n  ZNbZDWeSfI3K1bkh5REfAVLlp2dVErVNC3+qbLWExmGnla9BpxnT7qkIXR (...211 more characters)',
        stack: [
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb:274',
          'app/models/user.rb',
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/activesupport-6.0.4.1/lib/active_support/callbacks.rb:512',
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb:19',
        ],
      },
      appMapUri: {
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_resets.appmap.json',
      },
      problemLocation: {
        range: {},
        uri: {
          path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
        },
      },
      stackLocations: [
        {
          range: [
            { line: 273, character: 0 },
            { line: 273, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
          },
          truncatedPath: '.../.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
        },
        {
          range: [
            { line: 0, character: 0 },
            { line: 0, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
          },
          truncatedPath: '.../land-of-apps/sample_app_6th_ed/app/models/user.rb',
        },
        {
          range: [
            { line: 18, character: 0 },
            { line: 18, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb',
          },
          truncatedPath: '.../lib/action_controller/metal/instrumentation.rb',
        },
      ],
      ruleInfo: {
        id: 'deserialization-of-untrusted-data',
        name: 'Deserialization of untrusted data',
        title: 'Deserialization of untrusted data',
        references: {
          'CWE-502': 'https://cwe.mitre.org/data/definitions/502.html',
          'Ruby Security': 'https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html',
        },
        impactDomain: 'Security',
        description:
          "Finds occurrances of deserialization in which the mechanism employed is known to be unsafe, and the data comes from an untrusted source and hasn't passed through a sanitization mechanism.",
      },
      appMapName: 'Password_resets_password_resets',
    },
    {
      finding: {
        ruleId: 'deserialization-of-untrusted-data',
        appMapFile:
          '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_reset_attack.appmap.json',
        hash_v2: '5029373729e1556d3596a2cd5696dfd928e5607f86cc2f1f81a937a1623e2f40',
        impactDomain: 'Security',
        ruleTitle: 'Deserialization of untrusted data',
        message:
          'deserializes untrusted data: ---\noperation: reset\nsecret: !binary |-\n  ZNbZDWeSfI3K1bkh5REfAVLlp2dVErVNC3+qbLWExmGnla9BpxnT7qkIXR (...211 more characters)',
        stack: [
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb:274',
          'app/models/user.rb',
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/activesupport-6.0.4.1/lib/active_support/callbacks.rb:512',
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb:19',
        ],
      },
      appMapUri: {
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_reset_attack.appmap.json',
      },
      problemLocation: {
        range: {},
        uri: {
          path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
        },
      },
      stackLocations: [
        {
          range: [
            { line: 273, character: 0 },
            { line: 273, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
          },
          truncatedPath: '.../.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
        },
        {
          range: [
            { line: 0, character: 0 },
            { line: 0, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
          },
          truncatedPath: '.../land-of-apps/sample_app_6th_ed/app/models/user.rb',
        },
        {
          range: [
            { line: 18, character: 0 },
            { line: 18, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb',
          },
          truncatedPath: '.../lib/action_controller/metal/instrumentation.rb',
        },
      ],
      ruleInfo: {
        id: 'deserialization-of-untrusted-data',
        name: 'Deserialization of untrusted data',
        title: 'Deserialization of untrusted data',
        references: {
          'CWE-502': 'https://cwe.mitre.org/data/definitions/502.html',
          'Ruby Security': 'https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html',
        },
        impactDomain: 'Security',
        description:
          "Finds occurrances of deserialization in which the mechanism employed is known to be unsafe, and the data comes from an untrusted source and hasn't passed through a sanitization mechanism.",
      },
      appMapName: 'Password_resets_password_reset_attack',
    },
  ],
};

export const WithOneFinding = Template.bind({});
WithOneFinding.args = {
  findings: [
    {
      finding: {
        ruleId: 'deserialization-of-untrusted-data',
        appMapFile:
          '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_resets.appmap.json',
        hash_v2: '5029373729e1556d3596a2cd5696dfd928e5607f86cc2f1f81a937a1623e2f40',
        impactDomain: 'Security',
        ruleTitle: 'Deserialization of untrusted data',
        message:
          'deserializes untrusted data: ---\noperation: reset\nsecret: !binary |-\n  ZNbZDWeSfI3K1bkh5REfAVLlp2dVErVNC3+qbLWExmGnla9BpxnT7qkIXR (...211 more characters)',
        stack: [
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb:274',
          'app/models/user.rb',
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/activesupport-6.0.4.1/lib/active_support/callbacks.rb:512',
          '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb:19',
        ],
      },
      appMapUri: {
        path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/tmp/appmap/minitest/Password_resets_password_resets.appmap.json',
      },
      problemLocation: {
        range: {},
        uri: {
          path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
        },
      },
      stackLocations: [
        {
          range: [
            { line: 273, character: 0 },
            { line: 273, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
          },
          truncatedPath: '.../.rbenv/versions/3.0.2/lib/ruby/3.0.0/psych.rb',
        },
        {
          range: [
            { line: 0, character: 0 },
            { line: 0, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/app/models/user.rb',
          },
          truncatedPath: '.../land-of-apps/sample_app_6th_ed/app/models/user.rb',
        },
        {
          range: [
            { line: 18, character: 0 },
            { line: 18, character: 1.79e308 },
          ],
          uri: {
            path: '/home/ahtrotta/.rbenv/versions/3.0.2/lib/ruby/gems/3.0.0/gems/actionpack-6.0.4.1/lib/action_controller/metal/instrumentation.rb',
          },
          truncatedPath: '.../lib/action_controller/metal/instrumentation.rb',
        },
      ],
      ruleInfo: {
        id: 'deserialization-of-untrusted-data',
        name: 'Deserialization of untrusted data',
        title: 'Deserialization of untrusted data',
        references: {
          'CWE-502': 'https://cwe.mitre.org/data/definitions/502.html',
          'Ruby Security': 'https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html',
        },
        impactDomain: 'Security',
        description:
          "Finds occurrances of deserialization in which the mechanism employed is known to be unsafe, and the data comes from an untrusted source and hasn't passed through a sanitization mechanism.",
      },
      appMapName: 'Password_resets_password_resets',
    },
  ],
};
