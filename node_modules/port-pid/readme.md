# port-pid [![Build Status](https://travis-ci.org/radiovisual/port-pid.svg?branch=master)](https://travis-ci.org/radiovisual/port-pid)

> Get the pid(s) of the process on a given port.

## Install

```
$ npm install --save port-pid
```

## Usage

Get `all` the pids on a given port, or filter by `udp` (UDP) or `tcp` (TCP):

```js
const pids = require('port-pid');

pids(8017).then(pids => {
    
    console.log(pids.all);
    //=> [1234, 5678]
    
    console.log(pids.tcp);
    //=> [1234]
    
    console.log(pids.udp);
     //=> [5678]
});
```

## License

MIT © [Michael Wuergler](https://github.com/radiovisual)
