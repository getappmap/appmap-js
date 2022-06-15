import SchemaInferrer from '../src/schemaInferrer';

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
        },
      },
      type: 'object',
    });
  });
});
