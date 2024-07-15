import { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function VideoCall() {
  const [peerId, setPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [roomId, setRoomId] = useState<string>("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        const newPeer = new Peer({ initiator: false, stream });
        setPeer(newPeer);

        newPeer.on("signal", (data) => {
          setPeerId(JSON.stringify(data));
        });

        newPeer.on("signal", (data) => {
          socket.emit("offer", { offer: data, roomId });
        });

        newPeer.on("connect", () => {
          setConnected(true);
        });

        newPeer.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        socket.on("offer", (offer) => {
          newPeer.signal(offer);
        });

        socket.on("answer", (answer) => {
          newPeer.signal(answer);
        });

        socket.on("ice-candidate", (candidate) => {
          newPeer.signal(candidate);
        });
      });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const joinRoom = () => {
    if (roomId) {
      socket.emit("join", roomId);
    }
  };

  const connectToPeer = () => {
    if (peer && remotePeerId) {
      peer.signal(JSON.parse(remotePeerId));
    }
  };

  console.log(peerId);

  return (
    <div>
      <h1>Video P2P App</h1>
      <div>
        <video ref={localVideoRef} autoPlay muted playsInline />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <div>
        <h3>Your Peer ID:</h3>
        <input value={peerId} readOnly />
      </div>
      <div>
        <h3>Connect to Remote Peer:</h3>
        <textarea
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={connectToPeer}>Connect</button>
      </div>
      <div>{connected ? "Connected" : "Not Connected"}</div>
      <div>
        <h3>Room ID:</h3>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
}
