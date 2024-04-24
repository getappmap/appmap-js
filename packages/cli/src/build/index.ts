import { InputOptions, OutputOptions, RollupBuild, rollup } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { cp, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { exec } from 'child_process';

// see below for details on these options
const inputOptions: InputOptions = {
  input: 'src/cli.ts',
  treeshake: true,
  external: ['canvas'],
  plugins: [
    typescript({
      compilerOptions: {
        module: 'esnext',
      },
      outDir: 'dist',
    }),
    nodeResolve(),
    commonjs(),
    json(),
    replace({
      "require('canvas')": "{ /* require('canvas') */ }",
      'require.resolve': '(() => null)',
      '../../docs': './docs',
      '../../resources/inlines': '../resources/inlines',
      '../../../resources/inventory-report': '../resources/inventory-report',
      '../../../resources/change-report': '../resources/change-report',
      "requireBindings()('better_sqlite3.node')": "require('./build/better_sqlite3.node')",
      delimiters: ['', ''],
      preventAssignment: false,
    }),
    terser(),
  ],
};

// you can create multiple outputs from the same input to generate e.g.
// different formats like CommonJS and ESM
const outputOptionsList: OutputOptions[] = [
  {
    dir: 'dist',
    format: 'cjs',
    sourcemap: 'inline',
  },
];

async function generateOutputs(bundle: RollupBuild) {
  for (const outputOptions of outputOptionsList) {
    // generate output specific code in-memory
    // you can call this function multiple times on the same bundle object
    // replace bundle.generate with bundle.write to directly write to disk
    const { output } = await bundle.write(outputOptions);

    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
        // For assets, this contains
        // {
        //   fileName: string,              // the asset file name
        //   source: string | Uint8Array    // the asset source
        //   type: 'asset'                  // signifies that this is an asset
        // }
        console.log('Asset', chunkOrAsset);
      } else {
        // For chunks, this contains
        // {
        //   code: string,                  // the generated JS code
        //   dynamicImports: string[],      // external modules imported dynamically by the chunk
        //   exports: string[],             // exported variable names
        //   facadeModuleId: string | null, // the id of a module that this chunk corresponds to
        //   fileName: string,              // the chunk file name
        //   implicitlyLoadedBefore: string[]; // entries that should only be loaded after this chunk
        //   imports: string[],             // external modules imported statically by the chunk
        //   importedBindings: {[imported: string]: string[]} // imported bindings per dependency
        //   isDynamicEntry: boolean,       // is this chunk a dynamic entry point
        //   isEntry: boolean,              // is this chunk a static entry point
        //   isImplicitEntry: boolean,      // should this chunk only be loaded after other chunks
        //   map: string | null,            // sourcemaps if present
        //   modules: {                     // information about the modules in this chunk
        //     [id: string]: {
        //       renderedExports: string[]; // exported variable names that were included
        //       removedExports: string[];  // exported variable names that were removed
        //       renderedLength: number;    // the length of the remaining code in this module
        //       originalLength: number;    // the original length of the code in this module
        //       code: string | null;       // remaining code in this module
        //     };
        //   },
        //   name: string                   // the name of this chunk as used in naming patterns
        //   preliminaryFileName: string    // the preliminary file name of this chunk with hash placeholders
        //   referencedFiles: string[]      // files referenced via import.meta.ROLLUP_FILE_URL_<id>
        //   type: 'chunk',                 // signifies that this is a chunk
        // }
        console.log('Chunk', chunkOrAsset.modules);
      }
    }
  }

  const betterSqlite = require.resolve('better-sqlite3/package.json');
  if (betterSqlite) {
    const modulePath = dirname(betterSqlite);
    await mkdir(join('dist', 'build'), { recursive: true });
    await cp(
      join(modulePath, 'build', 'Release', 'better_sqlite3.node'),
      join('dist', 'build', 'better_sqlite3.node')
    );
  }

  await cp('package.json', 'dist/package.json');

  if (process.platform !== 'win32') {
    await exec('node --experimental-sea-config src/build/sea-config.json');
    await exec('cp $(command -v node) dist/appmap');
    await exec(
      [
        'npx postject dist/appmap NODE_SEA_BLOB dist/appmap.blob',
        '--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
      ].join(' ')
    );
  }
}

async function build() {
  let bundle: RollupBuild | undefined;
  let buildFailed = false;

  try {
    // create a bundle
    bundle = await rollup(inputOptions);

    // an array of file names this bundle depends on
    console.log(bundle.watchFiles);

    await generateOutputs(bundle);
  } catch (error) {
    buildFailed = true;
    // do some error reporting
    console.error(error);
  }

  if (bundle) {
    // closes the bundle
    await bundle.close();
  }

  process.exit(buildFailed ? 1 : 0);
}

build();
