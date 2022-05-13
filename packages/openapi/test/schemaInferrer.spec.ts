import SchemaInferrer from "../src/schemaInferrer";

describe(SchemaInferrer, () => {
  it('returns undefined when no examples', () => {
    expect(new SchemaInferrer().openapi()).toBeUndefined();
  });

  it('returns undefined when no good examples', () => {
    const inferrer = new SchemaInferrer();
    inferrer.addExample({
      class: 'nilclass',
      value: 'nil'
    });
    expect(inferrer.openapi()).toBeUndefined();
  });
});
