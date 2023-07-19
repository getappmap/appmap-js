const { buildAppMap } = require('@appland/models');
const Exceptions = require('../../../src/fingerprint/canonicalize/exceptions');

describe('Exceptions', () => {
  test('not present', () => {
    const result = Exceptions(
      buildAppMap({
        events: [
          {
            id: 1,
            event: 'call',
          },
          {
            id: 2,
            event: 'return',
            parent_id: 1,
          },
        ],
      }).build()
    );
    expect(result).toEqual([]);
  });
  test('single exception', () => {
    const result = Exceptions(
      buildAppMap({
        events: [
          {
            id: 1,
            event: 'call',
          },
          {
            id: 2,
            event: 'return',
            parent_id: 1,
            exceptions: [
              {
                path: '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb',
                class: 'JSON::ParserError',
                lineno: 67,
                message:
                  "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
                object_id: 47346496836920,
              },
            ],
          },
        ],
      }).build()
    );
    expect(result).toEqual([
      {
        location:
          '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb:67',
        class: 'JSON::ParserError',
        message:
          "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
        stack: [
          '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb:67',
        ],
      },
    ]);
  });
  test('collect ancestors into stack', () => {
    const appmap = buildAppMap({
      classMap: [
        {
          type: 'package',
          name: 'app',
          children: [
            {
              type: 'package',
              name: 'controllers',
              children: [
                {
                  type: 'class',
                  name: 'HomeController',
                  children: [
                    {
                      type: 'function',
                      name: 'index',
                      static: false,
                      location: 'app/controllers/home_controller.rb:5',
                    },
                  ],
                },
              ],
            },
            {
              type: 'package',
              name: 'models',
              children: [
                {
                  type: 'class',
                  name: 'User',
                  children: [
                    {
                      type: 'function',
                      name: 'find',
                      static: true,
                      location: 'app/models/user.rb:10',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      events: [
        {
          id: 1,
          thread_id: 1,
          event: 'call',
          path: 'app/controllers/home_controller.rb',
          defined_class: 'HomeController',
          method_id: 'index',
          static: false,
          lineno: 5,
        },
        {
          id: 2,
          thread_id: 1,
          event: 'call',
          path: 'app/models/user.rb',
          defined_class: 'User',
          method_id: 'find',
          static: true,
          lineno: 10,
        },
        {
          id: 3,
          thread_id: 1,
          event: 'return',
          parent_id: 2,
          exceptions: [
            {
              path: '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb',
              class: 'JSON::ParserError',
              lineno: 67,
              message:
                "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
              object_id: 47346496836920,
            },
          ],
        },
        {
          id: 4,
          thread_id: 1,
          parent_id: 1,
          event: 'return',
        },
      ],
    }).build();
    const result = Exceptions(appmap);
    expect(result).toEqual([
      {
        location:
          '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb:67',
        class: 'JSON::ParserError',
        message:
          "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
        stack: [
          '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb:67',
          'app/models/user.rb:10',
          'app/controllers/home_controller.rb:5',
        ],
      },
    ]);
  });
  test('uniquify exception', () => {
    const result = Exceptions(
      buildAppMap({
        events: [
          {
            id: 1,
            event: 'call',
          },
          {
            id: 2,
            event: 'return',
            parent_id: 1,
            exceptions: [
              {
                path: '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb',
                class: 'JSON::ParserError',
                lineno: 67,
                message:
                  "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
                object_id: 47346496836920,
              },
            ],
          },
          {
            id: 3,
            event: 'call',
          },
          {
            id: 4,
            event: 'return',
            parent_id: 3,
            exceptions: [
              {
                path: '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb',
                class: 'JSON::ParserError',
                lineno: 67,
                message:
                  "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
                object_id: 47346496836921, // Different object_id
              },
            ],
          },
        ],
      }).build()
    );
    expect(result).toEqual([
      {
        location:
          '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb:67',
        class: 'JSON::ParserError',
        message:
          "767: unexpected token at 'PjWXCtB4Y9DH4KajHNB1lkxlOuG7PuhxktaiFETErowH0kNO+VCJ292e854O+LeS/pLOEjzI7nj2EDSATCOdr103jdWt5JY3CFh8eHAyNNwQQiD1XQY2SvfaG+ld9T7t0KjOQx1zkayjlZP9+X/LsUuy1g77cQA83qDtCAL18dRu29OEjnCf1St3UU+X/gRmun7Og7ffd+tkIGNi4lmKA==--MhYqMRJLLhRkZLU3z1N1LA=='",
        stack: [
          '/home/travis/.rvm/gems/ruby-2.6.5/bundler/gems/appmap-ruby-d2ba81e811c2/lib/appmap/hook/method.rb:67',
        ],
      },
    ]);
  });
});
