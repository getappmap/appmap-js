---
layout: docs
title: Troubleshooting VS Code Extension
description: "Find solutions to common AppMap VS Code extension issues"
toc: true
troubleshooting: true
---

# Troubleshooting AppMap VS Code Extension

This guide helps you diagnose and resolve common startup issues with the AppMap VS Code extension.

## Accessing Error Logs

When the AppMap VS Code extension encounters problems, error messages and stack traces are logged to VS Code's Output panel:

1. Open VS Code's Output panel using `View -> Output`
2. Select "AppMap: Services" from the dropdown menu in the Output panel
3. Look for error messages and stack traces that can help identify the issue

## Common Startup Issues

### Linux GLIBC Version Compatibility

**Symptom:**  
The AppMap services fail to start with an error message about missing GLIBC version 2.29 or newer.

**Example Error:**

```
Error: /lib/x86_64-linux-gnu/libm.so.6: version `GLIBC_2.29' not found
(required by /tmp/pkg/.../better-sqlite3/build/Release/better_sqlite3.node)
```

**Solution:**  
This error occurs on older Linux distributions that use a GLIBC version older than 2.29. To resolve this:

1. Check your current GLIBC version:
   ```console
   $ ldd --version
   ```
2. Update your Linux distribution to a newer version that includes GLIBC 2.29 or later. Common distributions with GLIBC 2.29+:
   - Ubuntu 20.04 or newer
   - Debian 11 or newer
   - RHEL 8 or newer
   - Fedora 32 or newer

### Windows Permission and Temporary File Errors

**Symptom:**  
AppMap services fail to start with permission errors when trying to create directories in the Windows temp folder.

**Example Error:**

```
Error: EPERM: operation not permitted, mkdir 'C:\WINDOWS\TEMP\pkg\...'
```

**Common Causes:**

- Running VS Code as administrator
- Antivirus software interference
- Restricted system temporary directory permissions
- Misconfigured TEMP environment variable

**Solutions:**

1. Configure a user-writable temporary directory:

   - Open VS Code Settings (`Ctrl+,`)
   - Search for "AppMap: Command Line Environment"
   - Add a new environment variable: `TEMP=C:\Users\<username>\.appmap\temp`
   - Restart VS Code

2. Check antivirus settings:

   - Add VS Code and the AppMap temporary directory to your antivirus exclusions
   - Temporarily disable real-time scanning to test if it's causing the issue

3. Review VS Code privileges:
   - Avoid running VS Code as administrator unless necessary
   - Ensure your user account has write permissions to the temporary directory

## Advanced Troubleshooting

If the above solutions don't resolve your issue:

1. Enable detailed logging:

   - Open VS Code Settings
   - Search for "App Map: Command Line Verbose"
   - Enable verbose output
   - Restart VS Code
   - Check the Output panel for additional diagnostic information

2. Check system requirements:

   - Verify you have adequate disk space
   - Ensure your system meets the [minimum requirements](/docs/reference) for AppMap
   - Check for VS Code updates

3. Clean installation:
   - Uninstall the AppMap extension
   - Delete the AppMap data directory:
     - Windows: `%USERPROFILE%\.appmap`
     - Linux/macOS: `~/.appmap`
   - Reinstall the extension

## Getting Help

If you continue to experience issues:

1. Gather the following information:

   - VS Code version
   - AppMap extension version
   - Operating system and version
   - Error messages from the Output panel
   - Steps to reproduce the issue

2. [Open an issue](https://github.com/getappmap/vscode-appland/issues) on our GitHub repository.
