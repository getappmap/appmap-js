# Swagger 2 Support

This is a list of all the relevant field names in Swagger 2 and if the validation supports them.

## Swagger Object

| Field Name | Supported |
| --- | --- |
| basePath | no |
| consumes | no |
| produces | no |
| paths | yes |
| definitions | partial (only for request bodies) |
| parameters | partial (only for in: body parameters) |
| responses | partial (only for response bodies) |
| securityDefinitions | no |
| security | no |
| ^x- | yes |

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
| parameters | no |

## Operation Object

| Field Name | Supported |
| --- | --- |
| consumes | no |
| produces | no |
| parameters | yes |
| responses | no |
| deprecated | no |
| security | no |

## Parameter Object

| Field Name | Supported |
| --- | --- |
| name | yes |
| in | partial ('body' values only) |
| required | no |
| schema | yes |
| type | no |
| format | no |
| allowEmptyValue | no |
| items | no |
| collectionFormat | no |
| maximum | no |
| exclusiveMaximum | no |
| minimum | no |
| exclusiveMinimum | no |
| maxLength | no |
| minLength | no |
| pattern | no |
| maxItems | no |
| minItems | no |
| uniqueItems | no |
| enum | no |
| multipleOf | no |

## Items Object

| Field Name | Supported |
| --- | --- |
| type | no |
| format | no |
| items | no |
| collectionFormat | no |
| default | no |
| maximum | no |
| exclusiveMaximum | no |
| minimum | no |
| exclusiveMinimum | no |
| maxLength | no |
| minLength | no |
| pattern | no |
| maxItems | no |
| minItems | no |
| uniqueItems | no |
| enum | no |
| multipleOf | no |

## Responses Object

| Field Name | Supported |
| --- | --- |
| {http status code} | yes |
| default | partial (tested against itself, not against other http status codes) |

## Response Object

| Field Name | Supported |
| --- | --- |
| schema | yes |
| headers | partial (add / remove only) |

## Header Object

| Field Name | Supported |
| --- | --- |
| type | no |
| format | no |
| items | no |
| collectionFormat | no |
| maximum | no |
| exclusiveMaximum | no |
| minimum | no |
| exclusiveMinimum | no |
| maxLength | no |
| minLength | no |
| pattern | no |
| maxItems | no |
| minItems | no |
| uniqueItems | no |
| enum | no |
| multipleOf | no |

## Schema Object

Check supported functionality for the used version of the [json-schema-diff](https://bitbucket.org/atlassian/json-schema-diff) package.

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
| flow | no |
| authorizationUrl | no |
| tokenUrl | no |
| scopes | no |
