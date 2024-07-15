import { Server } from "socket.io";
import { PeerServer } from "peerjs";

export default async function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    const peerServer = PeerServer({
      port: process.env.PORT || 3000,
      path: "/peerjs",
    });

    const connectedPeers = {}; // Object to store connected peers in each room

    io.on("connection", (socket) => {
      socket.on("join-room", (roomId) => {
        socket.join(roomId);

        connectedPeers[roomId] = connectedPeers[roomId] || []; // Initialize room if not present
        connectedPeers[roomId].push(socket.id); // Add this socket to the room

        // Broadcast updated connected peers to all members in the room
        socket.broadcast
          .to(roomId)
          .emit("connected-peers", connectedPeers[roomId]);

        socket.on("disconnect", () => {
          connectedPeers[roomId] = connectedPeers[roomId].filter(
            (id) => id !== socket.id
          );
          // Broadcast updated connected peers after disconnect
          socket.broadcast
            .to(roomId)
            .emit("connected-peers", connectedPeers[roomId]);
        });
      });
      console.log(connectedPeers);

      socket.on("file-transfer", (data) => {
        // Broadcast the file data to all connected peers in the room
        socket.broadcast.to(data.roomId).emit("receive-file", data);
      });
    });

    res.socket.server.io = io;
    res.socket.server.peerServer = peerServer;
  }
}
