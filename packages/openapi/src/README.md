# appmap-openapi

`@appland/appmap openapi` generates
[OpenAPI 3](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md) YAML from
[AppMap](https://github.com/applandinc/appmap) data.

AppMaps contain rich information about HTTP server requests. `@appland/appmap openapi` collects and
organizes this information into the OpenAPI format.

The more (and better) functional and integration tests you write, the more OpenAPI you get. And
better yet, it's always accurate because it reflects the actual behavior of your code.

Once you've generated OpenAPI, you can configure your web app to serve the OpenAPI API and UI. Then
you can interact directly with your API, in the context of your app, through the OpenAPI UI. It's a
powerful way to browse, understand, and debug your API.

## Supported languages

`@appland/appmap` works with any language that has an AppMap client agent. Consult
[appland.org](https://appland.org/) for a current list of client agents, plus usage instructions and
examples.

## How it works

1. Install the AppMap client agent for your programming language.
2. Record AppMaps by running test cases.
3. Run `@appland/appmap openapi` to generate OpenAPI. You can customize the OpenAPI document using
   command-line options.
4. Review your OpenAPI docs using your code editor or the Swagger UI.

## Example

To try out `@appland/appmap openapi`:

1. Clone this repo
2. `yarn install` to get dependencies.
3. `cd packages/cli`
4. `yarn start openapi --appmap-dir tests/unit/fixtures`

## Usage

```sh-session
$ npx @appland/appmap openapi --help
@appland/appmap generate

Generate OpenAPI from AppMaps in a directory

Options:
  --version               Show version number                          [boolean]
  --verbose, -v           Run with verbose logging                     [boolean]
  --help                  Show help                                    [boolean]
  --appmap-dir            directory to recursively inspect for AppMaps
                                                         [default: "tmp/appmap"]
  --output-file, -o       output file name
  --openapi-template      template YAML; generated content will be placed in the
                          paths and components sections
  --openapi-title         info/title field of the OpenAPI document
  --openapi-version       info/version field of the OpenAPI document
  --openapi-default-host  servers[0]/variables/defaultHost/default field of the
                          OpenAPI document
```
