# OpenAPI Diff
> A CLI tool to identify differences between Swagger or OpenApi specifications.

## Requirements
- nodejs 10.x or higher (tested using 10.x, 12.x, 13.x and 14.x)
- npm 6.x or higher (tested using 6.x)
- Swagger 2 or OpenApi 3 specifications

## Installation

Install the tool using npm and add it to the package.json
```
npm install openapi-diff --save-dev
```

## Description

This tool identifies what has changed between two Swagger or OpenApi specification files. These changes are classified into three groups, breaking, non-breaking and unclassified. Using an approach based on set theory this tool is able to calculate these differences to a high level of accuracy.

### Supported Keywords

[SPEC_SUPPORT.md](SPEC_SUPPORT.md) contains the details of what Swagger and OpenApi keywords are supported.

### Change Classifications

Changes detected by this tool are classified into three groups.

#### Breaking

Changes that would make existing consumers incompatible with the API, for example:

- removing a path
- removing a method
- changing a property from optional to required in a request body
- changing a property from required to optional in a response body

#### Non Breaking

Changes that would **not** make existing consumers incompatible with the API, for example:

- adding a path
- adding a method
- changing a property from required to optional in a request body
- changing a property from optional to required in a response body

#### Unclassified

Changes that have been detected by the tool but can't be classified, for example:

- modifications to X-Properties

## Usage

### Usage as a cli tool

Invoke the tool with a file path to the source specification file and the destination specification file. These files should be in JSON or YAML format and be valid Swagger 2 or OpenApi 3 specificaitons.

The tool will output a list of breaking, non breaking and unclassified differences found between the source and desitnation files.

If any breaking changes are found the tool will return a non-zero exit code.

##### Example

*/path/to/source-specification.yaml*

```yaml
openapi: 3.0.1
info:
  title: User Service
  version: 1.0.0
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              properties:
                name:
                  type: string
              required:
                - name
              type: object
        required: true
      responses:
        201:
          description: Created
          content:
            application/json:
              schema:
                properties:
                  id:
                    type: string
                required:
                  - id
                type: object
  /users/{userId}:
    get:
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: The user
          content:
            application/json:
              schema:
                properties:
                  name:
                    type: string
                required:
                  - name
                type: object
```

*/path/to/destination-specification.yaml*

```yaml
openapi: 3.0.1
info:
  title: User Service
  version: 1.0.0
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              properties:
                name:
                  type: string
              required:
                - name
              type: object
        required: true
      responses:
        201:
          description: Created
          content:
            application/json:
              schema:
                properties:
                  id:
                    type: string
                required:
                  - id
                type: object
```

*Invoking the tool*

```
openapi-diff /path/to/source-specification.yaml /path/to/destination-specification.yaml
```

*Output*

```
Breaking changes found between the two specifications:
{
    "breakingDifferences": [
        {
            "type": "breaking",
            "action": "remove",
            "code": "path.remove",
            "destinationSpecEntityDetails": [],
            "entity": "path",
            "source": "openapi-diff",
            "sourceSpecEntityDetails": [
                {
                    "location": "paths./users/{userId}",
                    "value": {
                        "get": {
                            "parameters": [
                                {
                                    "name": "userId",
                                    "in": "path",
                                    "required": true,
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "The user",
                                    "content": {
                                        "application/json": {
                                            "schema": {
                                                "properties": {
                                                    "name": {
                                                        "type": "string"
                                                    }
                                                },
                                                "required": [
                                                    "name"
                                                ],
                                                "type": "object"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        }
    ],
    "breakingDifferencesFound": true,
    "nonBreakingDifferences": [],
    "unclassifiedDifferences": []
}
```

### Usage as a nodejs api

Invoke the library with a `SpecOption` for the source specification and the desitnation specification. A `SpecOption` has 3 properties:

|       Name |   Type   | Required | Description                                                  |
| ---------: | :------: | :------: | ------------------------------------------------------------ |
|  `content` | `string` |   Yes    | A string containing the serialised json or yaml content of the specification. |
| `location` | `string` |   Yes    | A label for the specification, typically a file path or file name but can be any value. This is used when reporting errors parsing the specification content. |
|   `format` | `string` |   Yes    | The format of the specification. Must be either `swagger2` or `openapi3` |

For full details of the nodejs api please refer to [api-types.d.ts](lib/api-types.d.ts)

#### Example

```javascript
const openapiDiff = require('openapi-diff');

const source = {
  // openapi3...
};

const destination = {
  // openapi3...
};

const result = await openapiDiff.diffSpecs({
  sourceSpec: {
    content: JSON.stringify(source),
    location: 'source.json',
    format: 'openapi3'
  },
  destinationSpec: {
    content: JSON.stringify(destination),
    location: 'destination.json',
    format: 'openapi3'
  }
});

if (result.breakingDifferencesFound) {
  console.log('Breaking change found!')
}
```

## Changelog
See [CHANGELOG.md](CHANGELOG.md)

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)

## License
See [LICENSE.txt](LICENSE.txt)
