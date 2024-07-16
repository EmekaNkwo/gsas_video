import { nanoid } from "nanoid";
import { io } from "socket.io-client";

export const sessionId = nanoid();

// export const useRemoteState = create<IRemoteState>()(() => ({
//   socket: createSocket(),
//   room: null, // current room user is in, null maps to landing page
//   connections: [],
// }));

const socket = io(`${process.env.NEXT_PUBLIC_BASE_URL as string}`, {
  path: "/ws",
  // withCredentials: !!process.env.NEXT_PUBLIC_BASE_URL,

  auth(cb) {
    cb({
      sessionId,
    });
  },
});

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
