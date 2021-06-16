# appmap-swagger

`appmap-js swagger` generates [Swagger 3](https://swagger.io/specification/)
(aka OpenAPI) YAML from [AppMap](https://appland.org/) data.

AppMaps contain rich information about HTTP server requests. `appmap-js swagger`
collects and organizes this information into the Swagger format.

The more (and better) functional and integration tests you write, the more
Swagger you get. And better yet, it's always accurate because it reflects the
actual behavior of your code.

Once you've generated Swagger, you can configure your web app to serve the
Swagger API and UI. Then you can interact directly with your API, in the context
of your app, through the Swagger UI. It's a powerful way to browse, understand,
and debug your API.

## Supported languages

`appmap-js swagger` works with any language that has an AppMap client. Consult
[appland.org](https://appland.org/) for a current list of clients, plus usage
instructions and examples.

## How it works

1. Install the AppMap client for your programming language.
2. Record AppMaps by running test cases.
3. Run `appmap-js swagger` to generate Swagger `paths` and `components`. Swagger
   YAML is printed to stdout.
4. Merge the paths and components into a wrapper template using some custom code
   in your project, or a standardized wrapper such as the `appmap:swagger` Rake
   task.
5. Open your Swagger docs using the Swagger API or Swagger UI.

## Example

To try out `appmap-js swagger`:

1. Clone this repo
2. `yarn install` to get dependencies.
3. `cd packages/cli`
4. `npx appmap-cli swagger --directory test/fixtures/appland`

## Usage

### List commands

```sh-session
$ npx appmap-cli help swagger
appmap-swagger <command>

Commands:
  appmap-swagger generate  Generate Swagger from AppMaps in a directory

Options:
      --version  Show version number                         [boolean]
  -v, --verbose  Run with verbose logging                    [boolean]
      --help     Show help
```

### `appmap-swagger generate`

```sh-session
$ appmap-swagger generate --help
appmap-swagger generate

Generate Swagger from AppMaps in a directory

Options:
      --version    Show version number                       [boolean]
  -v, --verbose    Run with verbose logging                  [boolean]
      --help       Show help                                 [boolean]
      --directory  directory to recursively inspect for AppMaps
                                               [default: "tmp/appmap"]
```
