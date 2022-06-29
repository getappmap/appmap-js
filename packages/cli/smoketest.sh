#!/bin/sh -ex

PKGDIR="$PWD"
TESTDIR="`mktemp -d`"

yarn pack --out "$TESTDIR"/package.tgz

cp -r tests/unit/fixtures/ruby "$TESTDIR"

cd "$TESTDIR"
echo '{}' > package.json
yarn add ./package.tgz

yarn run appmap index --appmap-dir ruby
yarn run appmap depends --appmap-dir ruby
yarn run appmap inventory --appmap-dir ruby
yarn run appmap openapi --appmap-dir ruby -o /dev/null

cd "$PKGDIR"
rm -rf "$TESTDIR"