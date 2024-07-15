import { io } from "socket.io-client";

const socket = io(`${process.env.NEXT_PUBLIC_BASE_URL as string}`);

const socketConected = () => {
  socket.connect();
};

const disconnectSocket = () => {
  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      socket.connect();
    }
  });
};

export { socket, socketConected, disconnectSocket };
