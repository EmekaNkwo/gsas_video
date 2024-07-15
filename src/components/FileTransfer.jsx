import Peer from "peerjs";
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
const peer = new Peer();

function FileTransfer() {
  const [socket, setSocket] = useState();
  const [roomId, setRoomId] = useState("");

  const [file, setFile] = useState(null);
  const [connectedPeers, setConnectedPeers] = useState([]);
  const socketConnect = io();

  console.log(socket);
  useEffect(() => {
    setSocket(socketConnect);

    socketConnect.on("connect", () => {
      console.log("Connected to socket.io server");
    });

    socketConnect.on("disconnect", () => {
      console.log("Disconnected from socket.io server");
    });

    socketConnect.on("connected-peers", (peers) => {
      setConnectedPeers(peers);
    });

    peer.on("open", (id) => {
      setRoomId(id); // Use PeerJS ID as room ID for simplicity
    });

    peer.on("connection", (conn) => {
      conn.on("data", (data) => {
        // Handle received file data
        // console.log("Received file data:", data);
      });
    });
  }, []);

  console.log(socketConnect);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleJoinRoom = () => {
    socketConnect.emit("join-room", roomId);
  };

  const handleSendFile = async () => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const fileData = {
        name: file.name,
        type: file.type,
        data: Buffer.from(reader.result),
      };

      socketConnect.emit("file-transfer", fileData);
    };
  };

  return (
    <div className="flex flex-col gap-5">
      <h1>Room ID: {roomId}</h1>
      <div className="flex flex-col gap-3">
        <input type="text" value={roomId} placeholder="Enter Room ID" />
        <button className="btn bg-blue-400" onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
      <hr />
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleSendFile} disabled={!file}>
        Send File
      </button>

      <ul>
        {connectedPeers.map((peerId) => (
          <li key={peerId}>{peerId}</li>
        ))}
      </ul>
    </div>
  );
}

export default FileTransfer;
