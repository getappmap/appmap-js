# OpenApi 3 Support

This is a list of all the relevant field names in OpenApi 3 and if the validation supports them.

## OpenAPI Object

| Field Name | Supported |
| --- | --- |
| servers | no |
| paths | yes |
| components | yes |
| security | no |
| ^x- | yes |

## Server Object

| Field Name | Supported |
| --- | --- |
| url | no |
| variables | no |

## Server Variable Object

| Field Name | Supported |
| --- | --- |
| enum | no |
| default | no |
| description | no |

## Components Object

| Field Name | Supported |
| --- | --- |
| schemas | partial (only for request and response bodies) |
| responses | yes |
| parameters | no |
| requestBodies | yes |
| headers | partial (add / remove only) |
| securitySchemes | no |
| callbacks | no |

## Path Item Object

| Field Name | Supported |
| --- | --- |
| $ref | partial, yes for internal non-circular references, no for external references, no for circular references |
| get | yes |
| put | yes |
| post | yes |
| delete | yes |
| options | yes |
| head | yes |
| patch | yes |
| trace | yes |
| servers | yes |
| parameters | no |

## Operation Object

| Field Name | Supported |
| --- | --- |
| parameters | no |
| requestBody | yes |
| responses | partial (only for response status codes) |
| callbacks | no |
| deprecated | no |
| security | no |
| servers | no |

## Parameter Object

| Field Name | Supported |
| --- | --- |
| name | no |
| in | no |
| required | no |
| deprecated | no |
| allowEmptyValue | no |
| style | no |
| explode | no |
| allowReserved | no |
| schema | no |
| content | no |
| matrix | no |
| label | no |
| form | no |
| simple | no |
| spaceDelimited | no |
| pipeDelimited | no |
| deepObject | no |

## Request Body Object

| Field Name | Supported |
| --- | --- |
| content | partial (yes for application/json, no for all other mime types) |
| required | no |

## Media Type Object

| Field Name | Supported |
| --- | --- |
| schema | yes |
| encoding | no |

## Encoding Object

| Field Name | Supported |
| --- | --- |
| contentType | no |
| headers | no |
| style | no |
| explode | no |
| allowReserved | no |

## Responses Object

| Field Name | Supported |
| --- | --- |
| {http status code} | partial (yes for specific status codes, no for ranges) |
| default | partial (tested against itself, not against other http status codes) |

## Response Object

| Field Name | Supported |
| --- | --- |
| headers | partial (add / remove only) |
| content | no |
| links | no |

## Callback Object

Not supported

## Link Object

| Field Name | Supported |
| --- | --- |
| operationRef | no |
| operationId | no |
| parameters | no |
| requestBody | no |
| description | no |
| server | no |

## Header Object

| Field Name | Supported |
| --- | --- |
| required | yes |
| deprecated | no |
| allowEmptyValue | no |
| style | no |
| explode | no |
| allowReserved | no |
| schema | no |
| content | no |
| simple | no |

## Schema Object

Check supported functionality for the used version of the [json-schema-diff](https://bitbucket.org/atlassian/json-schema-diff) package.

## Discriminator Object

| Field Name | Supported |
| --- | --- |
| propertyName | no |
| mapping | no |

## XML Object

| Field Name | Supported |
| --- | --- |
| name | no |
| namespace | no |
| prefix | no |
| attribute | no |
| wrapped | no |

## Security Scheme Object

| Field Name | Supported |
| --- | --- |
| type | no |
| name | no |
| in | no |
| scheme | no |
| bearerFormat | no |
| flows | no |
| openIdConnectUrl | no |

## OAuth Flows Object

| Field Name | Supported |
| --- | --- |
| implicit | no |
| password | no |
| clientCredentials | no |
| authorizationCode | no |
