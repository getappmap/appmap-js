# netstats [![Build Status](https://travis-ci.org/radiovisual/netstats.svg?branch=master)](https://travis-ci.org/radiovisual/netstats)

> Get the netstat activity on a given port.

## Install

```
$ npm install --save netstats
```

## Usage

```js
const netstats = require('netstats');

netstats(8017).then(results => {
    console.log(results);
});
```

## Example Output

On a mac or linux, the output is the same output you would get from running `lsof -i :<port>`

```
[ 
  'COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
  'nc      20661 michael    3u  IPv4 0x3b190d9d07c2c3db      0t0  TCP *:8017 (LISTEN)',
  'nc      21145 michael    3u  IPv4 0x3b190d9d054773db      0t0  TCP *:8017 (LISTEN)',
  'Python  21221 michael    3u  IPv4 0x3b190d9ceb8dfd7b      0t0  UDP localhost:8017' 
]; 
```

On windows, the output is the same as running `netstat.exe -a -n -o | findstr :<port>`
```
 [
  'TCP    0.0.0.0:9000           0.0.0.0:0              LISTENING       5220',
  'TCP    127.0.0.1:9000         127.0.0.1:62376        ESTABLISHED     5220',
  'TCP    127.0.0.1:9000         127.0.0.1:62379        ESTABLISHED     5220',
  'TCP    127.0.0.1:62288        127.0.0.1:9000         TIME_WAIT       0',
  'TCP    127.0.0.1:62299        127.0.0.1:9000         TIME_WAIT       0',
  'TCP    127.0.0.1:62376        127.0.0.1:9000         ESTABLISHED     7604',
  'TCP    127.0.0.1:62378        127.0.0.1:9000         ESTABLISHED     7604',
  'UDP    127.0.0.1:9000         *:*                                    1240',
 ];
```

## API

### netstats(port)

Returns a promise carrying the output array of line items.

#### port

Type: `number`<br/>
*Required*

The port number you are enquiring about.

## License

MIT © [Michael Wuergler](https://github.com/radiovisual)
