
const {strict:Assert} = require("assert");
const Net = require("net");

const { patch, getMaxMessageLength } = require("../lib/index.js");

const server = new Net.Server();

server.on("error", (error) => {
  console.log("Server error:", error.message);
});

server.on("close", () => {
  console.log("Server closed");
});

let counter = 0;

server.on("connection", (socket) => {
  console.log("Server connection");
  counter += 1;
  patch(socket);
  socket.on("message", (message) => {
    console.log("Server socket received:", message);
    socket.send("bar");
  });
  socket.on("error", (error) => {
    console.log("Server socket error:", error.message);
    throw error;
  });
  socket.on("end", () => {
    console.log("Server socket end");
  });
  socket.on("close", (hadError) => {
    console.log("Server socket close:", hadError);
    counter -= 1;
    if (counter === 0) {
      next();
    }
  });
});

const next = () => {
  const {done, value:test} = iterator.next();
  if (done) {
    console.log("Closing server");
    server.close();
  } else {
    console.log("Connecting to server");
    const socket = Net.connect(server.address().port);
    socket.on("connect", () => {
      counter += 1;
      console.log("Client socket connection");
      test(socket);
    });
    socket.on("error", (error) => {
      console.log("Client socket error:", error.message);
      throw error;
    });
    socket.on("end", () => {
      console.log("Client socket end");
    });
    socket.on("close", (hadError) => {
      console.log("Client socket close:", hadError);
      counter -= 1;
      if (counter === 0) {
        next();
      }
    });
  }
};

const iterator = [
  (socket) => {
    patch(socket);
    Assert.throws(
      () => socket.send("x".repeat(getMaxMessageLength() + 1)),
      /^Error: Message too large/),
    socket.send("foo");
    socket.on("readable", () => {
      socket.on("message", (message) => {
        console.log("Client socket received:", message);
        socket.end();
      });
    });
  },
  (socket) => {
    socket.end(Buffer.alloc(2, 0));
  },
  (socket) => {
    const buffer = Buffer.alloc(6, 0);
    buffer.writeUInt32LE(8);
    socket.end(buffer);
  },
][Symbol.iterator]();

server.listen(0, () => {
  const port = server.address().port;
  console.log("Listening to port", port);
  next();
});

