# net-socket-messaging

```sh
npm install net-socket-messaging
```

Implementation of a simple messaging protocol by monkey-patching a `net.Socket`.
The protocol is the simplest I could think of:
- The head consists of 4 bytes which encodes an unsigned 32 int written in little endian.
- The body is a string of bytes which encodes a string in utf8 and whose byte length is defined by the head.

## Example

```js
const socket = require("net").connect();
// `registerSocket` monkey-patches a net.Socket
// with the `send` method and the `message` event.
require("net-socket-messaging").monkeyPatch(socket);
// Once monkey-patched, the socket should not be
// directly used to read or write data.
const message = "foo";
socket.send(message);
// The `message` event is emitted only if there is a
// least one listener registered.
socket.on("message", (message) => {
  console.log("Received:", message);
});
```

## API

### NetSocketMessaging.patch(socket)

* `socket` `<net.Socket>`: the socket to monkey-patch.
* Returns `<undefined>`: I'm not a big fan of artificial chain callings, you should assume your side effects!

### NetSocketMessaging.getMaxByteLength()

* Returns `<integer>`: the maximum length of messages.

### `socket.send(message)`

Send a message through the `net.Socket`.

* `message` `<string>`: the message to send.
  Sending a string longer than `256 * 2^20` characters will fire an `'error'` event on the socket. There is two motivations for this limit:
  1. It ensures that the body is under 1GiB (as a single utf16 character may be encoded in as much as 4 bytes). There is two reasons why we want to limit the length of the body. First, the maximum number encoded by the head is `2^32`. Second, the `stream.readable.read(size)` does not accept a `size` argument greater than `2^30`.
  2. JS engines impose a limit to the length of strings. Although the ECMAScript 2016 specification states that the maximum length of a string is `2^53 - 1`, many engines opted for a smaller limit. A length of `256 * 2^20` is a conservative limit which most JS engines support.
* Returns `<null>` | `<boolean>`: `null` if the message is too big to be sent and a `<boolean>` as per the return value of `new.Socket.write(buffer)`.

### Event `'message'`

Emitted when a message has been fully received.

* `message` `<string>`: the received message. Neither the length of the body nor the length of the message is checked. If the engine supports it, a message as long as `2^32` characters could be provided.
