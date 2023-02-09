import { OpenAPIV3 } from 'openapi-types';
import SchemaInferrer, { isAmbiguousArray, mergeItems } from '../src/schemaInferrer';

describe(SchemaInferrer, () => {
  it('returns undefined when no examples', () => {
    expect(new SchemaInferrer().openapi()).toBeUndefined();
  });

  it('returns undefined when no good examples', () => {
    const inferrer = new SchemaInferrer();
    inferrer.addExample({
      class: 'nilclass',
      value: 'nil',
    });
    expect(inferrer.openapi()).toBeUndefined();
  });

  it('understands an array with properties', () => {
    const inferrer = new SchemaInferrer();
    inferrer.addExample({
      class: 'Hash',
      value: '{result}',
      properties: [
        {
          name: 'plans',
          class: 'Array',
          items: [
            {
              class: 'Hash',
              properties: [
                {
                  name: 'id',
                  class: 'Integer',
                },
                {
                  name: 'category',
                  class: 'String',
                },
                {
                  name: 'country',
                  class: 'NilClass',
                },
                {
                  name: 'created_at',
                  class: 'String',
                },
                {
                  name: 'is_current',
                  class: 'TrueClass',
                },
              ],
            },
          ],
        },
        {
          name: 'default_plan_id',
          class: 'Integer',
        },
        {
          name: 'page',
          class: 'Hash',
          properties: [
            {
              name: 'page_index',
              class: 'Integer',
            },
            {
              name: 'page_size',
              class: 'Integer',
            },
            {
              name: 'page_offset',
              class: 'Integer',
            },
            {
              name: 'page_prev_offset',
              class: 'Integer',
            },
          ],
        },
      ],
    });

    expect(inferrer.openapi()).toEqual({
      properties: {
        default_plan_id: {
          type: 'integer',
        },
        page: {
          properties: {
            page_index: {
              type: 'integer',
            },
            page_offset: {
              type: 'integer',
            },
            page_prev_offset: {
              type: 'integer',
            },
            page_size: {
              type: 'integer',
            },
          },
          type: 'object',
        },
        plans: {
          type: 'array',
          items: {
            properties: {
              category: {
                type: 'string',
              },
              created_at: {
                type: 'string',
              },
              id: {
                type: 'integer',
              },
              is_current: {
                type: 'boolean',
              },
            },
            type: 'object',
          },
        },
      },
      type: 'object',
    });
  });

  it(`can merge arrays that don't have items`, () => {
    const inferrer = new SchemaInferrer();
    inferrer.addExample({
      class: 'Hash',
      value: '{products=>[]}',
      object_id: 70132031886120,
      size: 1,
      properties: [
        {
          name: 'products',
          class: 'Array',
        },
      ],
    });
    inferrer.addExample({
      class: 'Hash',
      value: '{products=>[]}',
      object_id: 70131584403400,
      size: 1,
      properties: [
        {
          name: 'products',
          class: 'Array',
        },
      ],
    });
    expect(inferrer.openapi()).toEqual({
      properties: {
        products: {
          type: 'array',
          items: {},
        },
      },
      type: 'object',
    });
  });

  it(`can merge schema examples with nested properties`, () => {
    const inferrer = new SchemaInferrer();
    inferrer.addExample({
      class: 'hash',
      value: '{page:...}',
      properties: [
        {
          name: 'page',
          class: 'hash',
          properties: [
            {
              name: 'page_number',
              class: 'numeric',
            },
            {
              name: 'total',
              class: 'numeric',
            },
          ],
        },
      ],
    });
    inferrer.addExample({
      class: 'hash',
      value: '{page:...}',
      properties: [
        {
          name: 'page',
          class: 'hash',
          properties: [
            {
              name: 'page_size',
              class: 'numeric',
            },
          ],
        },
      ],
    });

    expect(inferrer.openapi()).toEqual({
      properties: {
        page: {
          type: 'object',
          properties: {
            page_number: {
              type: 'number',
            },
            page_size: {
              type: 'number',
            },
            total: {
              type: 'number',
            },
          },
        },
      },
      type: 'object',
    });
  });

  it(`can merge schema examples with triple nested properties`, () => {
    const inferrer = new SchemaInferrer();
    inferrer.addExample({
      class: 'hash',
      value: '{user:...}',
      properties: [
        {
          name: 'user',
          class: 'hash',
          properties: [
            {
              name: 'org',
              class: 'hash',
              properties: [
                {
                  name: 'login',
                  class: 'string',
                },
              ],
            },
          ],
        },
      ],
    });

    expect(inferrer.openapi()).toEqual({
      properties: {
        user: {
          type: 'object',
          properties: {
            org: {
              type: 'object',
              properties: {
                login: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      type: 'object',
    });
  });

  describe('merging array items', () => {
    it('identifies ambiguous array types', () => {
      expect(isAmbiguousArray({ type: 'array', items: {} })).toEqual(true);
      expect(
        isAmbiguousArray({
          type: 'array',
          items: { type: 'string' },
        })
      ).toEqual(false);
    });

    it('merges two ambiguous arrays', () => {
      expect(mergeItems({ type: 'array', items: {} }, { type: 'array', items: {} })).toEqual({
        type: 'array',
        items: {},
      });
    });

    it('merges two arrays with the same type', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
        },
      } as OpenAPIV3.ArraySchemaObject;
      expect(mergeItems(schema, schema)).toEqual(schema);
    });

    it('merges two arrays with differing types', () => {
      const schemaA = {
        type: 'array',
        items: {
          type: 'string',
        },
      } as OpenAPIV3.ArraySchemaObject;
      const schemaB = {
        type: 'array',
        items: {
          type: 'number',
        },
      } as OpenAPIV3.ArraySchemaObject;
      expect(mergeItems(schemaA, schemaB)).toEqual({
        type: 'array',
        items: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        },
      });
    });

    it('merges two arrays where one side contains multiple types', () => {
      const schemaA = {
        type: 'array',
        items: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        },
      } as OpenAPIV3.ArraySchemaObject;
      const schemaB = {
        type: 'array',
        items: {
          type: 'number',
        },
      } as OpenAPIV3.ArraySchemaObject;
      expect(mergeItems(schemaA, schemaB)).toEqual({
        type: 'array',
        items: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        },
      });
    });

    it('merges nested types within an array', () => {
      const schemaA = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        },
      } as OpenAPIV3.ArraySchemaObject;
      const schemaB = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
          },
        },
      } as OpenAPIV3.ArraySchemaObject;
      expect(mergeItems(schemaA, schemaB)).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
          },
        },
      });
    });
  });
});
