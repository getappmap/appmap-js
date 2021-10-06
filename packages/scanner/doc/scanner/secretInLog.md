## `secretInLog`

### Scope

`appmap`

### Events checked

Events labeled `log`.

### Match condition

All events in the AppMap are examined. When an event labeled `secret` is encountered, the 
`returnValue.value` is added to a set of known secrets.

When an event labeled `log` is encountered, all event parameter values are checked to see
if they contain any of the known secrets. 

### Options

None
