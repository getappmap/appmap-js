# posix-socket-messaging

This module implements the same simple messaging protocol as [net-socket-messaging](https://github.com/lachrist/net-socket-messagin) but in a *synchronous* manner on top of [posix-socket](https://github.com/lachrist/posix-socket).

**Disclaimer** Doing synchronous stuff in JavaScript is bad and you should not do it.
That being said, if you *are* going to do synchronous communication anyway you might as well do it efficiently and avoid the horrendous performance overhead of the synchronous functionalities of `child_process` and `fs`.

## Example

```js
const PosixSocket = require("posix-socket");
const {send, receive} = require("posix-socket-messaging");
const sockfd = PosixSocket.socket(PosixSocket.AF_INET6, PosixSocket.SOCK_STREAM, 0);
PosixSocket.connect(sockfd, {
  sin6_family: PosixSocket.AF_INET6,
  sin6_port: 8080,
  sin6_flowinfo: 0,
  sin6_addr: "::1",
  sin6_scope_id: 0
});
send(sockfd, "foo");
console.log(receive(sockfd));
PosixSocket.close(sockfd);
```

## API

### `send(sockfd, message)`

*Synchronously* send a message.

* `sockfd` `<integer>`: the file descriptor of the socket.
* `message` `<string>`: the message to send which cannot be longer than `256 * 2^20` characters.

### `message = receive(sockfd)`

*Synchronously* receive a message.

**Yes, this will block the entire node process up until you completely receive a message**.

* `sockfd` `<integer>`: the file descriptor of the socket.
* `message` `<string>`: the received message.
