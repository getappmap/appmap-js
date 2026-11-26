import { enableCompileCache } from 'module';

// Cache V8's compiled code on disk (under os.tmpdir() unless
// NODE_COMPILE_CACHE says otherwise), so runs after the first skip most of
// the parsing and compiling. This matters most for the native binaries,
// which package source rather than bytecode (see bin/build-native). Like
// enableSourceMaps, this only covers modules loaded after the call.
// enableCompileCache() was added in Node 22.1.
enableCompileCache?.();
