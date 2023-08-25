
const global_Reflect_defineProperty = global.Reflect.defineProperty;
const global_Error = global.Error;
const global_setImmediate = global.setImmediate;

const { Buffer } = require("buffer");
const Util = require("util");

let log = Util.debuglog("net-socket-messaging", (optimized) => {
  log = optimized;
});

// https://github.com/nodejs/node/issues/26607
// let BUFFER = Buffer.allocUnsafe(1024);
// function send (message) {
//   let bytelength = BUFFER.write(message, 4, "utf8") + 4;
//   if (bytelength > BUFFER.length - 8) {
//     bytelength = Buffer.byteLength(message, "utf8") + 4;
//     BUFFER = Buffer.allocUnsafe(bytelength + 8);
//     BUFFER.write(message, 4, "utf8");
//   }
//   BUFFER.writeUInt32LE(bytelength, 0);
//   this.write(BUFFER.slice(0, bytelength));
// };

const descriptor = {
  __proto__: null,
  value: null,
  writable: true,
  configurable: true,
  enumerable: true
};

exports.patch = (socket) => {
  global_Reflect_defineProperty(socket, "_messaging_length", {
    __proto__: descriptor,
    value: null,
  });
  global_Reflect_defineProperty(socket, "send", {
    __proto__: descriptor,
    value: send,
  });
  socket.on("newListener", onNewListener);
  socket.on("readable", onReadable);
};

const createMessage = (message) => {
  if (message.length > MAX) {
    log("message too large %i > %i", message.length, MAX);
    throw new global_Error(`Message too large, the maximum length is ${MAX} and got: ${message.length}`);
  }
  log("send: %s", message);
  const length = Buffer.byteLength(message, "utf8");
  const buffer = Buffer.allocUnsafe(4 + length);
  buffer.writeUInt32LE(length, 0);
  buffer.write(message, 4, length, "utf8");
  return buffer;
};

exports.createMessage = createMessage;

function onReadable () {
  log("receive called due to 'readable' event");
  receive(this);
}

function onNewListener (event, listener) {
  if (event === "message") {
    log("receive called due to new 'message' listener being added");
    // wait for listener to be added
    setImmediate(receive, this);
  }
}

// console.assert(Number.MAX_SAFE_INTEGER === 2**53 - 1);
const MAX = 256 * (2 ** 20); // 256MiB

exports.getMaxMessageLength = () => MAX;

const send = function (message) {
  return this.write(createMessage(message));
};

const receive = (socket) => {
  if (socket.listenerCount("message") === 0) {
    log("not receiving anything because missing 'message' listener");
    return null;
  }
  if (socket._messaging_length === null) {
    const head = socket.read(4);
    if (head === null) {
      log("not enough byte for reading a head (4)");
      return null;
    }
    if (head.length < 4) {
      log("socket ended in the middle of a head (4)");
      return null;
    }
    socket._messaging_length = head.readUInt32LE(0);
  }
  log("trying to read %i body bytes", socket._messaging_length);
  const body = socket.read(socket._messaging_length);
  if (body === null) {
    log("not enough byte for reading a body (%i)", socket._messaging_length);
    return null;
  }
  if (body.length < socket._messaging_length) {
    log("socket ended in the middle of a body (%i)", socket._messaging_length);
    return null;
  }
  socket._messaging_length = null;
  const message = body.toString("utf8");
  log("receive: %s", message);
  socket.emit("message", message);
  return receive(socket);
};
