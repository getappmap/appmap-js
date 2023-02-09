import assert from 'assert';
import { isFunction, isLoop } from '../../src/types';
import {
  findActionById,
  LIST_USERS_APPMAP,
  loadDiagram,
  SHOW_USER_APPMAP,
  USER_NOT_FOUND_APPMAP,
} from '../util';

describe('Sequence diagram', () => {
  describe('actor ordering', () => {
    it('matches invocation order', async () => {
      const diagram = loadDiagram(SHOW_USER_APPMAP);
      assert.deepStrictEqual(
        diagram.actors.map((a) => ({ id: a.id, order: a.order })),
        [
          { id: 'package:lib/controllers', order: 1000 },
          { id: 'package:lib/models', order: 2000 },
          { id: 'package:lib/database', order: 3000 },
          { id: 'package:lib/views/users', order: 4000 },
          { id: 'package:lib/views/posts', order: 5000 },
        ]
      );
    });
    it('can be customized', () => {
      const diagram = loadDiagram(SHOW_USER_APPMAP, {
        priority: { 'package:lib/database': 10000 },
      });
      assert.deepStrictEqual(
        diagram.actors.map((a) => ({ id: a.id, order: a.order })),
        [
          { id: 'package:lib/controllers', order: 1000 },
          { id: 'package:lib/models', order: 2000 },
          { id: 'package:lib/views/users', order: 3000 },
          { id: 'package:lib/views/posts', order: 4000 },
          { id: 'package:lib/database', order: 10000 },
        ]
      );
    });
  });

  describe('function name', () => {
    describe('static', () => {
      it('is reported', () => {
        const action = findActionById(SHOW_USER_APPMAP, 'lib/database/Database.query');
        assert(isFunction(action));
        assert.strictEqual(action.static, true);
      });
    });
    describe('non-static', () => {
      it('is reported', () => {
        const action = findActionById(SHOW_USER_APPMAP, 'lib/views/users/Views::Users::Show#show');
        assert(isFunction(action));
        assert.strictEqual(action.static, false);
      });
    });
  });

  describe('response', () => {
    describe('null-ish', () => {
      it('is omitted', () => {
        const action = findActionById(SHOW_USER_APPMAP, 'lib/database/Database.query');
        assert(isFunction(action));
        assert.strictEqual(action.returnValue, undefined);
      });
    });
    describe('object instance', () => {
      it('class name is reported', () => {
        const action = findActionById(SHOW_USER_APPMAP, 'lib/models/User.find');
        assert(isFunction(action));
        assert.deepStrictEqual(action.returnValue?.returnValueType, {
          name: 'User',
          properties: undefined,
        });
      });
    });
    describe('array', () => {
      it(`is reported as 'array'`, () => {
        const action = findActionById(LIST_USERS_APPMAP, 'lib/models/User.list');
        assert(isFunction(action));
        assert.deepStrictEqual(action.returnValue?.returnValueType, {
          name: 'array',
          properties: undefined,
        });
      });
    });
    describe('exception', () => {
      it('is reported', () => {
        const action = findActionById(USER_NOT_FOUND_APPMAP, 'lib/models/User.find');
        assert(isFunction(action));
        assert(
          action.returnValue && action.returnValue.raisesException,
          'Expecting raisesException to be truthy'
        );
      });
    });
  });

  describe('incoming message', () => {
    it('is reported', () => {
      const action = findActionById(SHOW_USER_APPMAP, 'lib/controllers/UsersController#show');
      assert(isFunction(action));
      assert(!action.caller);
    });
  });

  describe('loop', () => {
    it('is reported', () => {
      const action = findActionById(SHOW_USER_APPMAP, 'lib/views/posts/Views::Posts::Show#show');
      const loop = action.parent;
      assert(loop);
      assert(isLoop(loop));
      assert.strictEqual(loop.count, 2);
    });
    describe('nested', () => {
      const action = findActionById(LIST_USERS_APPMAP, 'lib/views/posts/Views::Posts::Show#show');
      const loop = action.parent;
      assert(loop);
      assert(isLoop(loop));
      assert.strictEqual(loop.count, 2);
      const enclosingLoop = loop.parent;
      assert(enclosingLoop);
      assert(isLoop(enclosingLoop));
      assert.strictEqual(enclosingLoop.count, 5);
    });
    describe('members', () => {
      it('acculumates event ids', () => {
        const action = findActionById(LIST_USERS_APPMAP, 'lib/models/User#posts');

        assert.deepEqual(action.eventIds, [7, 17, 27, 39, 49]);
      });
    });
  });
});
