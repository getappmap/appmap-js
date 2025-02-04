import ContentRestrictions from '../../../../src/rpc/explain/ContentRestrictions';

describe('ContentRestrictions', () => {
  let contentRestrictions: ContentRestrictions;

  beforeEach(() => {
    contentRestrictions = new ContentRestrictions();
  });

  it('should set restrictions', () => {
    const root = '/project';
    contentRestrictions.setGlobalRestrictions(['**/.env']);
    contentRestrictions.setLocalRestrictions(root, local);

    expect(contentRestrictions.isRestricted(root, '.env')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src/.env')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src/some-dir/kernel.rs')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some-subdir/secrets.json')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src/secret-file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src/file.cfg')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'scripts/deeper/file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'tests/file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'tests/deeper/file.txt')).toBe(false);
    expect(contentRestrictions.isRestricted(root, 'src/deeper/temp.rb')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src/temp.rb')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'main_test.go')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/where/server.js')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'server_config.rs')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/where/session.js')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/where/temp.mk')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/where/temp.md')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/where/packages/file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/packages/deeper/file.txt')).toBe(false);
    expect(contentRestrictions.isRestricted(root, 'some/where/packaged/file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/packaged/deeper/file.txt')).toBe(false);
    expect(contentRestrictions.isRestricted(root, 'some/security/deeper/file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some/where/security/file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src/ok.py')).toBe(false);

    expect(contentRestrictions.isRestricted('/project/test.js')).toBe(false);
    expect(contentRestrictions.isRestricted('/project/src/test.js')).toBe(false);
    expect(contentRestrictions.isRestricted('/project/src/ok.py')).toBe(false);
    expect(contentRestrictions.isRestricted('/project/main_test.go')).toBe(true);
    expect(contentRestrictions.isRestricted('/some/.env')).toBe(true);
  });

  it('should handle windows paths', () => {
    const root = 'C:\\project';
    contentRestrictions.setGlobalRestrictions(['**/.env']);
    contentRestrictions.setLocalRestrictions(root, local);

    expect(contentRestrictions.isRestricted(root, 'src\\some-dir\\kernel.rs')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'some-subdir\\secrets.json')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src\\secret-file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'src\\file.cfg')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'scripts\\deeper\\file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'tests\\file.txt')).toBe(true);
    expect(contentRestrictions.isRestricted(root, 'tests\\deeper\\file.txt')).toBe(false);
    expect(contentRestrictions.isRestricted(root, 'src\\deeper\\temp.rb')).toBe(true);

    expect(contentRestrictions.isRestricted('C:\\project\\test.js')).toBe(false);
    expect(contentRestrictions.isRestricted('C:\\project\\src\\test.js')).toBe(false);
    expect(contentRestrictions.isRestricted('C:\\project\\src\\ok.py')).toBe(false);
    expect(contentRestrictions.isRestricted('C:\\project\\main_test.go')).toBe(true);
    expect(contentRestrictions.isRestricted('c:\\project\\main_test.go')).toBe(true);
    expect(contentRestrictions.isRestricted('D:\\user\\.env')).toBe(true);
  });

  it('should throw an error if local restrictions are required but not set', () => {
    contentRestrictions.localRequired = true;
    expect(() => contentRestrictions.isRestricted('/project', 'test.js')).toThrow(
      'No local restrictions for root /project'
    );
    expect(contentRestrictions.safeRestricted('/project', 'test.js')).toBe(true);
  });

  it('should not throw an error if local restrictions are not required and not set', () => {
    expect(contentRestrictions.isRestricted('/project', 'test.js')).toBe(false);
  });
});

const local = [
  // Ignore the `/src/some-dir/kernel.rs` file in this repository.
  '/src/some-dir/kernel.rs',
  // Ignore files called `secrets.json` anywhere in this repository.
  'secrets.json',
  // Ignore all files whose names begin with `secret` anywhere in this repository.
  'secret*',
  // Ignore files whose names end with `.cfg` anywhere in this repository.
  '*.cfg',
  // Ignore all files in or below the `/scripts` directory of this repository.
  '/scripts/**',
  // Ignore any files in the `/tests` directory.
  '/tests/*',
  // Ignore files called `temp.rb` in or below the `/src` directory.
  '/src/**/temp.rb',
  // Ignore the `/main_test.go` file.
  '/main_test.go',
  // Ignore any files with names beginning with `server` or `session` anywhere in this repository.
  '{server,session}*',
  // Ignore any files with names ending with `.md` or `.mk` anywhere in this repository.
  '*.m[dk]',
  // Ignore files directly within directories such as `packages` or `packaged` anywhere in this repository.
  '**/package?/*',
  // Ignore files in or below any `security` directories, anywhere in this repository.
  '**/security/**',
];
