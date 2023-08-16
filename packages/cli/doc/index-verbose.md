# Verbose indexing output

If `-v` or `--verbose` option is given to `index` command, the command prints more detailed status
information on standard output. While the output is human-readable, some messages might have a
simple well-defined format and are suitable for parsing.

## `Indexed `

Currently the only message with a well-defined format is emitted after an AppMap file has been
successfully (re)indexed. The format is a line starting with `Indexed ` followed by the full path to
the AppMap. The path is quoted (see below) if it contains newlines, quotation marks or null
characters, otherwise it's verbatim. The message ends with a newline character.

Examples:

```
Indexed /home/user/project/tmp/appmap/map1.appmap.json
Indexed "/home/user/\"weird\0path\n!\"/tmp/appmap/map2.appmap.json"
Indexed C:\Users\Emmanuel Goldstein\Projects\Contoso\tmp\appmap\test.appmap.json
Indexed "C:\\Users\\user\\\"Important\" project\\tmp\\appmap\\test.appmap.json"
```

## Path quoting

Path are quoted by replacing backslash characters with `\\`, newline characters with `\n`, null
characters with `\0`, and quote marks with `\"`, then wrapping in quote marks. Note `Indexed `
messages only quote the path when necessary.
