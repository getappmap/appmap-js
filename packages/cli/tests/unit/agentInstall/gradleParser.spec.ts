import { GradleParser, GradleParseResult } from '../../../src/cmds/agentInstaller/gradleParser';

const sources = {
  buildscript: `
// This is a sample build.gradle file
buildscript {
  // line one
  // line 2
}
`,
  plugins: `
// This is a sample build.gradle file
plugins {
  id 'java'
  // line 2
}
`,
  repositories: `
// This is a sample build.gradle file
repositories {
google()
// line 2
}
`,
};

describe('GradleParser', () => {
  ['buildscript', 'plugins', 'repositories'].forEach((kw) => {
    expect(sources[kw]).not.toBeUndefined(); // sanity check
    describe(kw, () => {
      it('is found', () => {
        const parser = new GradleParser();
        const result = parser.parse(sources[kw]);
        expect(result[kw]).not.toBeNull();
        expect(result[kw]!.lbrace).toEqual(sources[kw].indexOf('{'));
        expect(result[kw]!.rbrace).toEqual(sources[kw].indexOf('}'));
      });
      it('is ignored in a comment', () => {
        const commentSrc = '/*' + sources[kw] + '*/';
        const result = new GradleParser().parse(commentSrc);
        expect(result.buildscript).toBeUndefined();
      });
    });
  });
});
