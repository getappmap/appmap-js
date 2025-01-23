import processPatchset from '../../../src/lib/processPatchset';

describe('processPatchset', () => {
  it('should handle patchset with small diffs correctly', () => {
    const patchset = `diff --git a/file1.txt b/file1.txt
index 83db48f..f735c4e 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello AppMap
 This is a test file.`;

    const result = processPatchset(patchset, 1000);
    expect(result).toContain('Hello AppMap');
  });

  it('should have the correct output format', () => {
    const largeDiff = 'a'.repeat(2000);
    const patchset = `Here's some header.
diff --git a/file1.txt b/file1.txt
index 83db48f..f735c4e 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello AppMap
This is a test file.
diff --git a/file2.txt b/file2.txt
index 83db48f..f735c4e 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1,3 +1,3 @@
${largeDiff}
diff --git a/file3.txt b/file3.txt
index 83db48f..f735c4e 100644
--- a/file3.txt
+++ b/file3.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello AppMap
 This is another test file.`;

    const result = processPatchset(patchset, 1000);
    expect(result).toMatchInlineSnapshot(`
        "Here's some header.
        diff --git a/file1.txt b/file1.txt
        index 83db48f..f735c4e 100644
        --- a/file1.txt
        +++ b/file1.txt
        @@ -1,3 +1,3 @@
        -Hello World
        +Hello AppMap
        This is a test file.
        diff --git a/file2.txt b/file2.txt
        [Change of size 2078]
        diff --git a/file3.txt b/file3.txt
        index 83db48f..f735c4e 100644
        --- a/file3.txt
        +++ b/file3.txt
        @@ -1,3 +1,3 @@
        -Hello World
        +Hello AppMap
         This is another test file."
      `);
  });

  it('should handle patchsets with multiple commit headers like from git log', () => {
    const patchset = `commit 1
Author: John Doe <john.doe@example.com>
Date:   Mon Jan 1 12:00:00 2023 +0000

    Initial commit

diff --git a/file1.txt b/file1.txt
index 83db48f..f735c4e 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello AppMap
 This is a test file.

commit 2
Author: Jane Doe <jane.doe@example.com>
Date:   Tue Jan 2 12:00:00 2023 +0000

    Second commit

diff --git a/file2.txt b/file2.txt
index 83db48f..f735c4e 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello AppMap
 This is another test file.`;

    const result = processPatchset(patchset, 10);
    expect(result).toMatchInlineSnapshot(`
        "commit 1
        Author: John Doe <john.doe@example.com>
        Date:   Mon Jan 1 12:00:00 2023 +0000

            Initial commit

        diff --git a/file1.txt b/file1.txt
        [Change of size 126]
        commit 2
        Author: Jane Doe <jane.doe@example.com>
        Date:   Tue Jan 2 12:00:00 2023 +0000

            Second commit

        diff --git a/file2.txt b/file2.txt
        [Change of size 132]
        "
      `);
  });

  it('should handle patchset with large diffs correctly', () => {
    const largeDiff = 'a'.repeat(2000);
    const patchset = `diff --git a/file2.txt b/file2.txt
index 83db48f..f735c4e 100644
--- a/file2.txt
+++ b/file2.txt
@@ -1,3 +1,3 @@
${largeDiff}`;

    const result = processPatchset(patchset, 1000);
    expect(result).toContain('[Change of size 2078]');
  });

  it('should handle patchset with mixed diff sizes correctly', () => {
    const largeDiff = 'a'.repeat(2000);
    const smallDiff = 'b'.repeat(500);
    const patchset = `diff --git a/file3.txt b/file3.txt
index 83db48f..f735c4e 100644
--- a/file3.txt
+++ b/file3.txt
@@ -1,3 +1,3 @@
${largeDiff}
diff --git a/file4.txt b/file4.txt
index 83db48f..f735c4e 100644
--- a/file4.txt
+++ b/file4.txt
@@ -1,3 +1,3 @@
${smallDiff}`;

    const result = processPatchset(patchset, 1000);
    expect(result).toContain('[Change of size 2078]');
    expect(result).toContain(smallDiff);
  });

  it('should return other text unchanged', () => {
    const diffs = ['This is some text with no diffs.', '', '- this\n+ that'];
    const result = diffs.map((diff) => processPatchset(diff));
    expect(result).toEqual(diffs);
  });
});

