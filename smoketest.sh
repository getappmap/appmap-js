#!/bin/sh -ex

PKGDIR="$PWD"
TESTDIR="`mktemp -d /tmp/appmap-smoke.XXXX`"

yarn workspaces foreach -pi --exclude root pack -o $TESTDIR/%s.tgz
cp -r "packages/cli/tests/unit/fixtures/ruby" "${TESTDIR}"

cd "${TESTDIR}"

yarn set version 3.2.2  # 3.2.1 has broken pnp support

node "$PKGDIR/ci/make-smoke-package-json.mjs"
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install

yarn run appmap index --appmap-dir ruby
yarn run appmap depends --appmap-dir ruby
yarn run appmap inventory --appmap-dir ruby > /dev/null
yarn run appmap openapi --appmap-dir ruby -o /dev/null

cd "$PKGDIR"
rm -rf "$TESTDIR"
