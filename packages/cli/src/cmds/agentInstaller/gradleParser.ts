import moo from 'moo';

class SourceOffsets {
  braceIdx: number = 1;
  // A syntactically correct build file will always have an rbrace to match the
  // lbrace.
  rbrace: number = -1;
  constructor(readonly blockName: string, readonly lbrace: number) {}
}

// These are the names blocks that can contain "repositories" blocks:
enum RepositoriesContainers {
  buildscript = "buildscript", 
  allprojects = "allprojects", 
  subprojects = "subprojects"
};
const REPOSITORIES_CONTAINERS = Object.values(RepositoriesContainers);

// These are the names of the other blocks we care about:
enum OtherContainers {
  repositories = 'repositories', 
  plugins = 'plugins'
};

const keywords = {
  ...RepositoriesContainers,
  ...OtherContainers
};
type Keywords = typeof keywords;
const KEYWORDS = Object.values(keywords);

/**
 * The results of parsing a build.gradle file. 
 *
 * startOffset is the first non-comment, non-whitespace character. mavenPresent
 * will be true if `mavenCentral()` is included in the repositories.
 * 
 * The rest of the properties take their names from the keywords above. Each is
 * a SourceOffsets corresponding to block, or undefined if the block is not
 * present.
 **/
export type GradleParseResult = {
  startOffset: number,
  mavenPresent: boolean,
} & {[k in keyof Keywords]?: SourceOffsets};;

export class GradleParser {
  public debug: number = 0;

  /**
   * Parse the given gradle source, returning a GradleParseResult describing what we found.
   *
   * Owes a debt to https://github.com/no-context/moo/pull/93 .
   */
  parse(src: string): GradleParseResult {
    const lexer = moo.states({
      gradle: {
        keyword: KEYWORDS,
        mavenCentral: 'mavenCentral',
        comment: { match: /\/\/.*?\n/, lineBreaks: true },
        multicomment: /\/\*[^]*?\*\//,
        // idents aren't interpreted, but they make debugging easier
        ident: /[\w.]+/,
        multistring: { match: /"""/, push: 'mstringbeg' },
        string: /'(?:\\[^]|[^\\'])*?'|"(?:\\[^]|[^\\"])*?"/,
        lbrace: { match: '{', push: 'brace' },
        space: { match: /\s+/, lineBreaks: true },
        other: { match: /[^]/, lineBreaks: true },
      },
      mstringbeg: {
        mstringend: { match: /"""/, pop: 1 },
        other: { match: /[^]/, lineBreaks: true },
      },
      brace: {
        rbrace: { match: '}', pop: 1 },
        // gradle state is a catch-all, so it needs to be included after rbrace
        include: 'gradle',
      },
    });

    let t;
    let startBlock: string | null = null;
    const blockStack: SourceOffsets[] = [];
    lexer.reset(src);
    let result:GradleParseResult = {
      startOffset: -1, 
      mavenPresent: false
    };

    // eslint-disable-next-line no-cond-assign
    /* eslint-disable no-continue */
    /* eslint-disable no-plusplus */
    while ((t = lexer.next())) {
      const writeDebug = () => {
        console.log(`${t.type} ${t.value} ${JSON.stringify(blockStack)}`);
      };

      if (this.debug > 1) {
        writeDebug();
      }

      const ignored = ['comment', 'multicomment', 'other', 'space'];
      if (ignored.includes(t.type!)) {
        continue;
      }
      if (this.debug === 1) {
        writeDebug();
      }
      
      if (t.type === 'keyword') {
        if (result.startOffset < 0) {
          result.startOffset = t.offset;
        }

        // We're only interested in the repositories block if it's not within
        // the buildscript block.
        const inBuildscript =
          blockStack.length === 1 && REPOSITORIES_CONTAINERS.includes(blockStack[0].blockName as RepositoriesContainers);
        if (t.value !== 'repositories' || !inBuildscript) {
          startBlock = t.value;
          continue;
        }
      }

      if (startBlock) {
        // The keyword tokens can appear in multiple places in a gradle file.
        // We'll only be starting a block if the keyword is immediately followed
        // by a left brace.
        if (t.type === 'lbrace') {
          const newOffsets = new SourceOffsets(startBlock, t.offset);
          result[startBlock] = newOffsets;
          if (this.debug > 0) {
            console.log(`result is now ${JSON.stringify(result, null, 2)}`);
          }
          blockStack.unshift(newOffsets);
        }
        startBlock = null;
        continue;
      }

      // We're not in a block, nothing else to do
      if (blockStack.length === 0) {
        continue;
      }

      if (t.type === 'lbrace') {
        blockStack[0].braceIdx++;
      } else if (t.type === 'rbrace') {
        blockStack[0].braceIdx--;
      } else if (
        t.type === 'mavenCentral' &&
        blockStack[0].blockName === 'repositories'
      ) {
        // The current token is mavenCentral, and we're in the repositories
        // block. This is the one we care about.
        result.mavenPresent = true;
      }

      if (blockStack[0].braceIdx === 0) {
        blockStack[0].rbrace = t.offset;
        const offsets = blockStack.shift();
        result[offsets!.blockName] = offsets;
      }
    }

    if (result.startOffset < 0) {
      // No interesting tokens, we need to copy the whole file.
      result.startOffset = src.length;
    }
    return result;
  }
  
  checkSyntax(parseResult: GradleParseResult) {
    KEYWORDS.forEach((k) => {
      if (parseResult[k]?.rbrace === -1) {
        throw new Error(
          `parse failed, ${JSON.stringify(parseResult, null, 2)}`
        );
      }
    });
  }  
}


