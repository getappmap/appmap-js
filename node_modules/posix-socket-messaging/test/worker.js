
const { strict: Assert} = require("assert");
const PosixSocketMessaging = require("../lib/index.js");
const PosixSocket = require("posix-socket");

const port = parseInt(process.argv[2]);

console.log("Client creating socket...");

const sockfd = PosixSocket.socket(PosixSocket.AF_INET6, PosixSocket.SOCK_STREAM, 0);

console.log("Client created socket:", sockfd);

console.log("Client connecting...");

console.log("Client connected:", PosixSocket.connect(sockfd, {
  sin6_family: PosixSocket.AF_INET6,
  sin6_port: port,
  sin6_flowinfo: 0,
  sin6_addr: "::1",
  sin6_scope_id: 0
}));

Assert.throws(
  () => PosixSocketMessaging.send(sockfd, "x".repeat(PosixSocketMessaging.getMaxByteLength() + 1)),
  /^Error: The message length is too large/);

const test = (request) => {
  console.log("Client sending...");
  PosixSocketMessaging.send(sockfd, request);
  console.log("Client sent:", request.length, request.substring(0, 10), "...");
  console.log("Client receiving...");
  const response = PosixSocketMessaging.receive(sockfd);
  Assert.equal(2 * request.length, response.length);
  console.log("Client received:", response.length, response.substring(0, 10), "...");
};

test("foo");
test("barqux");
test("x".repeat(64*2**10));

console.log("Client closing...");
console.log("Client closed:", PosixSocket.close(sockfd));
