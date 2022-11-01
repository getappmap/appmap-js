import { buildAppMap } from '@appland/models';
import assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isClientRPC, isServerRPC } from '../../src/types';
import { findAction, findActor, FIXTURE_DIR, loadDiagram } from '../util';

export const CHECKOUT_UPDATE_PAYMENT_APPMAP_FILE = 'checkout_update_payment.appmap.json';
export const CHECKOUT_UPDATE_PAYMENT_APPMAP = buildAppMap()
  .source(
    JSON.parse(
      readFileSync(join(FIXTURE_DIR, 'appmaps', CHECKOUT_UPDATE_PAYMENT_APPMAP_FILE), 'utf-8')
    )
  )
  .build();

describe('Sequence diagram', () => {
  const diagram = loadDiagram(CHECKOUT_UPDATE_PAYMENT_APPMAP);

  describe('HTTP server request', () => {
    it('is recorded', () => {
      findActor(diagram, 'http:HTTP server requests');

      const action = findAction(
        diagram,
        (action) => isServerRPC(action) && action.route === 'PATCH /checkout/update/{state}'
      );
      assert(action, `Server RPC 'PATCH /checkout/update/{state}' not found`);
      assert(isServerRPC(action));
      assert.strictEqual(action.status, 302);
    });
  });

  describe('HTTP client request', () => {
    it('is recorded', () => {
      findActor(diagram, 'external-service:api.stripe.com');

      const action = findAction(
        diagram,
        (action) =>
          isClientRPC(action) && action.route === 'POST https://api.stripe.com/v1/customers'
      );
      assert(action, `Client RPC 'POST https://api.stripe.com/v1/customers' not found`);
      assert(isClientRPC(action));
      assert.strictEqual(action.status, 200);
    });

    it('sorts to the left of the database', () => {
      const service = findActor(diagram, 'external-service:api.stripe.com');
      const database = findActor(diagram, 'database:Database');
      assert.strictEqual(service.order, database.order - 1000);
    });
  });
});
