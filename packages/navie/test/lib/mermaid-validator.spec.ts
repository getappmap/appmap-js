import MermaidValidator from '../../src/lib/mermaid-validator';

describe('MermaidValidator', () => {
  test('should validate a correct Mermaid diagram', async () => {
    const validDiagram = `
      graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;
    `;

    const validator = new MermaidValidator(validDiagram.trim());
    const result = await validator.validate();

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should invalidate an incorrect Mermaid diagram', async () => {
    const invalidDiagram = `
      graph TD;
        A--&gt;B;
        A--&gt;C;
        B-->D;
        C--D;
    `;

    const validator = new MermaidValidator(invalidDiagram.trim());
    const result = await validator.validate();

    expect(result.valid).toBe(false);
    expect(result.error).toMatch('Parse error on line 2:');
  });

  test('should handle empty diagram', async () => {
    const emptyDiagram = '';

    const validator = new MermaidValidator(emptyDiagram);
    const result = await validator.validate();

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle syntax error in Mermaid diagram', async () => {
    const invalidSyntaxDiagram = `
      graph TD
        A->>B
        A->>C
        B-->D
        C->D
    `;

    const validator = new MermaidValidator(invalidSyntaxDiagram.trim());
    const result = await validator.validate();

    expect(result.valid).toBe(false);
    expect(result.error).toMatch('Parse error on line 2:');
  });

  test('may produce an internal error', async () => {
    const complexValidDiagram = `
      graph LR
        subgraph one
          a1-->a2
        end
        subgraph two
          b1-->b2
        end
        a1-->b1
    `;

    const validator = new MermaidValidator(complexValidDiagram.trim());
    const result = await validator.validate();

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(`vN.sanitize is not a function`);
  });
});
