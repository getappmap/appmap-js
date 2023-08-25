
const {strict:Assert} = require("assert");
const Net = require("net");
const FileSystem = require("fs");
const NetSocketMessaging = require("net-socket-messaging");
const ChildProcess = require("child_process");
const Path = require("path");

const server = new Net.Server();

server.on("error", (error) => {
  console.log("Server error:", error.message);
});

server.on("close", () => {
  console.log("Server closed");
});

server.on("connection", (socket) => {
  console.log("Server connection");
  NetSocketMessaging.patch(socket);
  socket.on("message", (message) => {
    console.log("Server received:", message.length, message.substring(0, 10));
    message = message + message;
    socket.send(message);
    console.log("Server sent:", message.length, message.substring(0, 10));
    server.close();
  });
  socket.on("error", () => {
    console.log("Server socket error:", error.message);
    throw error;
  });
  socket.on("end", () => {
    console.log("Server socket end");
  });
  socket.on("close", (hadError) => {
    console.log("Server socket close:", hadError);
  });
});

server.listen(0, () => {
  const port = server.address().port;
  console.log("Server listening to", port);
  ChildProcess.fork(Path.join(__dirname, "worker.js"), [port], {
    stdio: "inherit"
  });
});
