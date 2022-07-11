import buildAppMap from '../../src/appMapBuilder';
import ClassMap from '../../src/classMap';
import { CodeObjectType } from '../../src/codeObjectType';
import scenario from './fixtures/user_page_scenario.appmap.json';
import httpScenario from './fixtures/many_requests_scenario.json';
import petClinicScenario from './fixtures/spring_petclinic.json';

describe('ClassMap', () => {
  describe('', () => {
    const userPageClassMap = new ClassMap(scenario.classMap);

    it('should have root ids', () => {
      expect(userPageClassMap.roots.map((co) => co.id)).toEqual([
        'json',
        'net/http',
        'openssl',
        'app/models',
        'app/controllers',
      ]);
    });

    it('should have root names', () => {
      expect(userPageClassMap.roots.map((co) => co.name)).toEqual([
        'json',
        'net/http',
        'openssl',
        'app/models',
        'app/controllers',
      ]);
      expect(
        Array.from(new Set(userPageClassMap.roots.map((co) => co.location)))
      ).toEqual([undefined]);
    });

    it('package should not have a locations list', () => {
      const modelsPackage = userPageClassMap.codeObjectFromId('app/models');
      expect(modelsPackage.locations).toEqual([]);
    });

    it('class should have locations list', () => {
      const userClass = userPageClassMap.codeObjectFromId(
        'app/models/User::Show'
      );
      expect(userClass.locations).toEqual(['app/models/user.rb']);
    });

    it('function should have locations list', () => {
      const userClass = userPageClassMap.codeObjectFromId(
        'app/models/User::Show#accept_eula?'
      );
      expect(userClass.locations).toEqual(['app/models/user.rb:109']);
    });

    it('function can be looked up by location', () => {
      const userClass = userPageClassMap.codeObjectsAtLocation(
        'app/models/user.rb:109'
      );
      expect(userClass.map((co) => co.id)).toEqual([
        'app/models/User::Show#accept_eula?',
      ]);
    });

    it('function can provide class name', () => {
      const userClass = userPageClassMap.codeObjectsAtLocation(
        'app/models/user.rb:109'
      );
      expect(userClass.map((co) => co.classOf)).toEqual(['User::Show']);
    });

    it('serializes properly', () => {
      const undefinedElement = userPageClassMap
        .toJSON()
        .find((obj) => obj === null);
      expect(undefinedElement).toBeUndefined();
    });
  });
  describe('bindEvents', () => {
    const classMap = new ClassMap(httpScenario.classMap);
    const events = buildAppMap().source(httpScenario).collectEvents();
    classMap.bindEvents(events);

    const uniqueRoutes = [
      ...new Set(events.filter((e) => e.httpServerRequest).map((e) => e.route)),
    ];

    it('creates HTTP code objects properly', () => {
      const httpEvent = events.find((e) => e.httpServerRequest);
      const { codeObject } = httpEvent;
      expect(codeObject.type).toEqual(CodeObjectType.ROUTE);
      expect(codeObject.name).toEqual(httpEvent.route);
      expect(codeObject.static).toEqual(undefined);

      const { parent } = codeObject;
      expect(parent.type).toEqual(CodeObjectType.HTTP);
      expect(parent.name).toEqual('HTTP server requests');
      expect(parent.children).toHaveLength(uniqueRoutes.length);
      expect(classMap.httpObject.children).toHaveLength(uniqueRoutes.length);
    });

    it('guarantees routes are represented by a single parent', () => {
      const uniqueParents = new Set(
        classMap.httpObject.children.map((obj) => obj.parent)
      );

      expect(uniqueParents.size).toEqual(1);
    });

    it('adds root level code objects', () => {
      [CodeObjectType.HTTP, CodeObjectType.DATABASE].forEach((type) => {
        const objects = classMap.roots.filter((obj) => obj.type === type);
        expect(objects).toHaveLength(1);
      });
    });

    it('adds many children to existing code objects', () => {
      const { httpObject } = classMap;

      uniqueRoutes.forEach((route) => {
        const routeObject = httpObject.children.find(
          (obj) => obj.type === 'route' && obj.name === route
        );

        const numEvents = events.filter(
          (e) => e.isCall() && e.route === route
        ).length;

        expect(routeObject).toBeTruthy();
        expect(routeObject.events).toHaveLength(numEvents);
      });
    });

    it('provides access to sql events', () => {
      const totalSqlEvents = events.filter((e) => e.isCall() && e.sql).length;

      const sql = classMap.sqlObject;
      expect(sql).toBeTruthy();

      const numSqlEvents = sql.children
        .map((child) => child.events)
        .flat().length;

      expect(numSqlEvents).toEqual(totalSqlEvents);
    });

    it('provides access to http events', () => {
      const totalHttpRoutes = events.filter(
        (e) => e.isCall() && e.httpServerRequest
      ).length;

      const http = classMap.httpObject;
      expect(http).toBeTruthy();
      expect(http.allEvents).toHaveLength(totalHttpRoutes);
    });

    describe('JSON serialization', () => {
      const verifyJSON = (obj, expected) => {
        const json = JSON.stringify(obj, null, 2);
        expect(JSON.parse(json)).toEqual(expected);
      };

      describe('function', () => {
        const { codeObject } = events.find(
          (e) => e.isCall() && e.method_id && e.codeObject.labels.size > 0
        );

        it('preserves attributes', () => {
          verifyJSON(codeObject, {
            labels: ['security', 'crypto'],
            location: 'OpenSSL::Cipher#encrypt',
            name: 'encrypt',
            static: false,
            type: 'function',
          });
        });
      });

      describe('class', () => {
        const codeObject = events.find(
          (e) => e.isCall() && e.codeObject.type === 'function'
        ).codeObject.parent;

        it('preserves attributes', () => {
          verifyJSON(codeObject, {
            name: 'RootController',
            type: 'class',
            children: [
              {
                location: 'app/controllers/spree/admin/root_controller.rb:8',
                name: 'index',
                static: false,
                type: 'function',
              },
            ],
          });
        });
      });

      describe('SQL query', () => {
        const { codeObject } = events.find((e) => e.isCall() && e.sql);

        it('preserves attributes', () => {
          verifyJSON(codeObject, {
            type: 'query',
            name: 'SELECT COUNT(*) FROM "spree_stores"',
          });
        });
      });

      describe('HTTP server request', () => {
        const { codeObject } = events.find(
          (e) => e.isCall() && e.httpServerRequest
        );

        it('preserves attributes', () => {
          verifyJSON(codeObject, { name: 'GET /admin', type: 'route' });
        });
      });
    });

    describe('dynamically created code objects', () => {
      const dynamicObjects = () => {
        const result = [];
        classMap.visit((co) => {
          if (co.data.dynamic) result.push(co);
        });
        return result;
      };

      it('exist', () => {
        expect(dynamicObjects().length).toBeGreaterThan(0);
      });

      it('are not created for class or package types', () => {
        expect(
          dynamicObjects().filter(
            (obj) => obj.type === 'class' || obj.type === 'package'
          )
        ).toHaveLength(0);
      });
    });
  });

  describe('leafs', () => {
    const { classMap } = buildAppMap(petClinicScenario).build();

    it('resolves most specialized descendants of the same type', () => {
      const roots = classMap.roots.map((root) => root.leafs()).flat();

      expect(roots[0].id).toEqual(
        'org/springframework/samples/petclinic/model'
      );
      expect(roots[1].id).toEqual(
        'org/springframework/samples/petclinic/owner'
      );
      expect(roots[2].id).toEqual('HTTP server requests');
      expect(roots).toHaveLength(3);
    });
  });
});
