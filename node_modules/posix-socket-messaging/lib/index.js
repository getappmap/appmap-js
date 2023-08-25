
const global_Error = global.Error;
const global_ArrayBuffer = global.ArrayBuffer;

const { Buffer } = require("buffer");
const PosixSocket = require("posix-socket");

const MAX = 256 * (2 ** 20);

exports.getMaxByteLength = () => MAX;

// By creating our own array buffer we prevent node from managing it.
// This remove a bug where some random bytes are written to the socket.
const makeBuffer = (length) => Buffer.from(new global_ArrayBuffer(length));

let buffer = makeBuffer(64*2**10);

const write = (sockfd, arraybuffer, length) => {
  /* c8 ignore start */
  if (PosixSocket.send(sockfd, arraybuffer, length, 0) < length) {
    throw new global_Error(`Could not write the entire message ${length} bytes`);
  }
  /* c8 ignore stop */
};

exports.send = (sockfd, message) => {
  if (message.length > MAX) {
    throw new global_Error(`The message length is too large, the maximum is ${MAX} and got: ${message.length}`);
  }
  let length = buffer.write(message, 4, "utf8");
  // 4 bytes for the head and at least a padding of 4 bytes at the end
  if (buffer.length < length + 8) {
    length = Buffer.byteLength(message, "utf8");
    buffer = makeBuffer(length + 4);
    buffer.write(message, 4, "utf8");
  }
  buffer.writeUInt32LE(length);
  write(sockfd, buffer.buffer, length + 4);
};

const read = (sockfd, arraybuffer, length) => {
  /* c8 ignore start */
  if (PosixSocket.recv(sockfd, arraybuffer, length, PosixSocket.MSG_WAITALL) < length) {
    throw new global_Error(`Could not read the entire message part of ${length} bytes`);
  }
  /* c8 ignore stop */
};

exports.receive = (sockfd) => {
  read(sockfd, buffer.buffer, 4);
  const length = buffer.readUInt32LE(0);
  if (buffer.length < length) {
    buffer = makeBuffer(length);
  }
  read(sockfd, buffer.buffer, length);
  return buffer.toString("utf8", 0, length);
};
