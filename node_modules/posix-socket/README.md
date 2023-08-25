# PosixSocket

This npm module makes the POSIX Socket API available to node with minimal changes.

* `sockfd = socket(domain, type, protocol)`
* `bind(sockfd, addr)`
* `accept(sockfd, addr)`
* `connect(sockfd, addr)`
* `send(sockfd, buf, len, flags)`
* `sendto(sockfd, buf, len, flags, dest_addr)`
* `recv(sockfd, buf, len, flags)`
* `recvfrom(sockfd, buf, len, flags, src_addr)`
* `close(fd)`
* `shutdown(sockfd, how)`
* `getsockopt(sockfd, level, optname)`
* `setsockopt(sockfd, level, optname, optval)`

Differences with the POSIX Socket API:

1. Socket addresses are specified as JavaScript objects.
   Currently, only three address families are supported:
   * Local/Unix (`sockaddr_un`): `{sun_family:1, sun_path:"path/to/unix-sock.sock"}`.
   * Inet (`sockaddr_in`): `{sin_family:2, sin_port:8080, sin_addr:"127.0.0.1"}`.
   * Inet6 (`sockaddr_in6`): `{sin6_family:24, sin6_port:8080, sin6_flowinfo:0, sin6_addr:"::1", sin6_scope_id:0}`.
2. The length of socket addresses is computed by the module.
3. In `getsockopt` and `setsockopt`: `optval` can only be a number.

I made this module to perform fast synchronous communication between node processes.
Please, don't ask me why I needed the perform synchronous communication.
Without C++ addon, this can only be achieved with the synchronous API of `fs` / `child_process`.
Both these solutions are incredibly inefficient.

# Example

## Server

```js
const PosixSocket = require("posix-socket");
const sockfd = PosixSocket.socket(PosixSocket.AF_UNIX, PosixSocket.SOCK_STREAM, 0);
PosixSocket.bind(sockfd, {
  sun_family: PosixSocket.AF_UNIX,
  sun_path: "/tmp/yo.sock"
});
PosixSocket.listen(sockfd, 1);
const address = {};
const sockfd1 = PosixSocket.accept(sockfd, address);
console.log("connection accepted from", address);
const buffer = new ArrayBuffer(100);
const size = PosixSocket.recv(sockfd1, buffer, buffer.byteLength, 0);
console.log("got: <"+String.fromCharCode.apply(null, new Uint16Array(buffer, 0, size))+">");
PosixSocket.close(sockfd);
require("fs").unlinkSync("/tmp/yo.sock");
```

## Client

```js
const PosixSocket = require("posix-socket");
const sockfd = PosixSocket.socket(PosixSocket.AF_UNIX, PosixSocket.SOCK_STREAM, 0);
PosixSocket.connect(sockfd, {
  sun_family: PosixSocket.AF_UNIX,
  sun_path: "/tmp/yo.sock"
});
const buffer = new ArrayBuffer(100);
const view = new Uint16Array(buffer, 0, buffer.length);
const string = "HelloWorld!";
for (let i = 0; i<string.length; i++)
  view[i] = string.charCodeAt(i);
PosixSocket.send(sockfd, buffer, string.length*view.BYTES_PER_ELEMENT, 0);
PosixSocket.close(sockfd);
```

## Troubleshooting

https://github.com/nodejs/node-gyp/blob/master/macOS_Catalina.md

