import Event from '../../../src/event';
import hashEvent from '../../../src/event/hash';

function checkSimplification(event, simplified) {
  return () =>
    expect(hashEvent(new Event(event))).toEqual(
      hashEvent(new Event(simplified))
    );
}

describe('event/hash', () => {
  test('only accepts call events', () => {
    expect(() => hashEvent({ event: 'return' })).toThrow();
  });

  test(
    'simplifies HTTP events',
    checkSimplification(
      {
        id: 6369,
        event: 'call',
        thread_id: 5609880,
        http_server_request: {
          request_method: 'GET',
          path_info: '/api/users/1/credit_cards',
          normalized_path_info: '/api/users/:user_id/credit_cards(.:format)',
        },
        message: [
          {
            name: 'format',
            class: 'String',
            value: 'json',
            object_id: 6887560,
          },
          {
            name: 'controller',
            class: 'String',
            value: 'spree/api/credit_cards',
            object_id: 39005300,
          },
          {
            name: 'action',
            class: 'String',
            value: 'index',
            object_id: 5700040,
          },
          {
            name: 'user_id',
            class: 'String',
            value: '1',
            object_id: 76120140,
          },
        ],
      },
      {
        event: 'call',
        http_server_request: {
          request_method: 'GET',
          normalized_path_info: '/api/users/:user_id/credit_cards(.:format)',
        },
      }
    )
  );

  test(
    'simplifies plain call events',
    checkSimplification(
      {
        id: 6370,
        event: 'call',
        thread_id: 5609880,
        defined_class: 'Spree',
        method_id: 'user_class',
        path: '/home/user/projects/solidus/core/lib/spree/core.rb',
        lineno: 26,
        static: true,
        parameters: [],
        receiver: {
          class: 'Module',
          object_id: 10676620,
          value: 'Spree',
        },
      },
      {
        event: 'call',
        defined_class: 'Spree',
        method_id: 'user_class',
        static: true,
      }
    )
  );

  test(
    'simplifies SQL events',
    checkSimplification(
      {
        id: 6392,
        event: 'call',
        thread_id: 5609880,
        sql_query: {
          sql: 'SELECT "spree_orders".* FROM "spree_orders" WHERE "spree_orders"."user_id" = ? LIMIT ?',
          database_type: 'sqlite',
          server_version: '3.22.0',
        },
      },
      {
        event: 'call',
        sql_query: {
          sql: 'SELECT "spree_orders".* FROM "spree_orders" WHERE "spree_orders"."user_id" = 55 LIMIT 30',
        },
      }
    )
  );
});
