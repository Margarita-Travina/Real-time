const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");

app.use(cors({ origin: "*" }));
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    console.log(`${name} joining room: ${room}`);
    socket.join(room); // подключаю к комнате

    const { user, isExist } = addUser({ name, room });

    // const userMessage = isExist ? `${user.name}, here you go again` :  `Hey, welcome ${user.name}!`

    socket.emit("message", {
      data: { user: { name: "Admin" }, message: `Hey, welcome ${user.name}!` },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: { user: { name: "Admin" }, message: `${user.name} has joined` },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: { user: { name: "Admin" }, message: `${user.name} has joined` },
    });

    io.to(user.room).emit("joinRoom", {
      data: { users: getRoomUsers(user.room) },
    });

    console.log(`Users in room ${user.room}: `, getRoomUsers(user.room));
  });

  socket.on("searchUser", ({ room, searchQuery }) => {
    const usersInRoom = getRoomUsers(room);
    const result = usersInRoom.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    socket.emit("searchResult", { result });
  });

  socket.on("sendMessage", ({ message, params }) => {
    const user = findUser(params);

    if (user) {
      io.to(user.room).emit("message", {
        data: { user, message },
      });
    }
  });

  socket.on("leftRoom", ({ params }) => {
    const user = removeUser(params);

    if (user) {
      const { room, name } = user;

      io.to(room).emit("message", {
        data: { user: { name: "Admin" }, message: `${name} has left` },
      });

      io.to(room).emit("room"),
        {
          data: { users: getRoomUsers(room) },
        };
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
