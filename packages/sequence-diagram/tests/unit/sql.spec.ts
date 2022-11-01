import { buildAppMap } from '@appland/models';
import assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isQuery } from '../../src/types';
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

  describe('SQL query', () => {
    it('is recorded', () => {
      findActor(diagram, 'database:Database');

      const action = findAction(
        diagram,
        (action) =>
          isQuery(action) &&
          action.query ===
            `SELECT "spree_roles".* FROM "spree_roles" WHERE "spree_roles"."sample_indicator_id" IS NULL AND "spree_roles"."name" = $1`
      );
      assert(action, `Matching SQL query not found`);
    });
    it('sorts to the right side of the diagram', () => {
      const database = findActor(diagram, 'database:Database');
      assert.strictEqual(database.order, 21000);
    });
  });
});
