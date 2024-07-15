"use client";
import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

import Video from "./Video";
import { socket } from "@/utils/socket";

interface Message {
  message: string;
  userId: string;
}

interface StreamObj {
  userId: string;
  stream: MediaStream;
}

const ConnectPeer: React.FC = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRoomFull, setIsRoomFull] = useState<boolean>(false);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [remoteStreams, setRemoteStreams] = useState<StreamObj[]>([]);
  const peersRef = useRef<{ [key: string]: SimplePeer.Instance }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [usersApp, setUsersApp] = useState<string[]>([]);

  const createPeer = (
    userToSignal: string,
    callerId: string,
    stream: MediaStream
  ): SimplePeer.Instance => {
    const peer = new SimplePeer({
      initiator: callerId === socket.id,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal: SimplePeer.SignalData) => {
      socket.emit("signal", { userId: userToSignal, signal, room: roomId });
    });

    peer.on("stream", (remoteStream: MediaStream) => {
      console.log("Received remote stream from:", userToSignal);
      setRemoteStreams((prevStreams) => {
        if (!prevStreams.some((s) => s.userId === userToSignal)) {
          return [
            ...prevStreams,
            { userId: userToSignal, stream: remoteStream },
          ];
        }
        return prevStreams;
      });
    });

    return peer;
  };

  console.log(socket);

  useEffect(() => {
    socket.on("room-joined", ({ users }: { users: string[] }) => {
      setUsersApp(users);
      users.forEach((userId) => {
        if (userId !== socket.id) {
          const peer = createPeer(
            userId,
            String(socket.id),
            stream as MediaStream
          );
          peersRef.current[userId] = peer;
        }
      });
    });

    socket.on("user-connected", (userId: string) => {
      const peer = createPeer(userId, String(socket.id), stream as MediaStream);
      peersRef.current[userId] = peer;
    });

    socket.on(
      "signal",
      (data: { userId: string; signal: SimplePeer.SignalData }) => {
        const peer = peersRef.current[data.userId];
        if (peer) {
          peer.signal(data.signal);
        } else {
          const peer = createPeer(
            data.userId,
            String(socket.id),
            stream as MediaStream
          );
          peer.signal(data.signal);
          peersRef.current[data.userId] = peer;
        }
      }
    );

    socket.on(
      "receive-message",
      ({ message, userId }: { message: string; userId: string }) => {
        setMessages((prevMessages) => [...prevMessages, { message, userId }]);
      }
    );

    socket.on("user-disconnected", (userId: string) => {
      const peer = peersRef.current[userId];
      if (peer) {
        peer.destroy();
        delete peersRef.current[userId];
        setRemoteStreams((prevStreams) =>
          prevStreams.filter((s) => s.userId !== userId)
        );
      }
    });

    socket.on("room-full", () => {
      setIsRoomFull(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [stream]);

  const joinRoom = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        localVideoRef.current!.srcObject = currentStream;
        socket.emit("join-room", roomId);
      });
  };

  const leaveRoom = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};

    setRemoteStreams([]);
    socket.emit("leave-room", roomId);
    socket.disconnect();
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isAudioOn;
      setIsAudioOn(!isAudioOn);
    }
  };

  const sendMessage = () => {
    socket.emit("send-message", { roomId, message });

    if (socket.id) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { message, userId: String(socket.id) },
      ]);
    }
    setMessage("");
  };

  if (isRoomFull) {
    return <div>Room is full. Please try another room.</div>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Enter room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
      <button onClick={leaveRoom}>Leave Room</button>
      <div>
        <video ref={localVideoRef} autoPlay muted></video>
      </div>
      <div id="remoteVideos">
        {remoteStreams?.map((streamObj, index) => (
          <Video
            key={index}
            stream={streamObj.stream}
            isLocal={streamObj.userId === socket.id}
          />
        ))}
      </div>
      <div>
        <button onClick={toggleVideo}>
          {isVideoOn ? "Stop Video" : "Start Video"}
        </button>
        <button onClick={toggleAudio}>
          {isAudioOn ? "Stop Audio" : "Start Audio"}
        </button>
      </div>
      {/* <div>
        <input
          type="text"
          placeholder="Enter message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h3>Chat</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.userId}</strong>: {msg.message}
            </li>
          ))}
        </ul>
      </div> */}
    </div>
  );
};

export default ConnectPeer;
