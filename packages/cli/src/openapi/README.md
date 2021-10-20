# appmap-openapi

`appmap-js openapi` generates [OpenAPI 3](https://openapi.io/specification/)
(aka OpenAPI) YAML from [AppMap](https://appland.org/) data.

AppMaps contain rich information about HTTP server requests. `appmap-js openapi`
collects and organizes this information into the OpenAPI format.

The more (and better) functional and integration tests you write, the more
OpenAPI you get. And better yet, it's always accurate because it reflects the
actual behavior of your code.

Once you've generated OpenAPI, you can configure your web app to serve the
OpenAPI API and UI. Then you can interact directly with your API, in the context
of your app, through the OpenAPI UI. It's a powerful way to browse, understand,
and debug your API.

## Supported languages

`appmap-js openapi` works with any language that has an AppMap client. Consult
[appland.org](https://appland.org/) for a current list of clients, plus usage
instructions and examples.

## How it works

1. Install the AppMap client for your programming language.
2. Record AppMaps by running test cases.
3. Run `appmap-js openapi` to generate OpenAPI `paths` and `components`. OpenAPI
   YAML is printed to stdout.
4. Merge the paths and components into a wrapper template using some custom code
   in your project, or a standardized wrapper such as the `appmap:openapi` Rake
   task.
5. Open your OpenAPI docs using the OpenAPI API or OpenAPI UI.

## Example

To try out `appmap-js openapi`:

1. Clone this repo
2. `yarn install` to get dependencies.
3. `cd packages/cli`
4. `npx @appland/appmap openapi --directory test/fixtures/appland`

## Usage

```sh-session
$ npx @appland/appmap openapi -h
@appland/appmap generate

Generate OpenAPI from AppMaps in a directory

Options:
      --version    Show version number                       [boolean]
  -v, --verbose    Run with verbose logging                  [boolean]
      --help       Show help                                 [boolean]
      --appmap-dir directory to recursively inspect for AppMaps
                                               [default: "tmp/appmap"]
```
