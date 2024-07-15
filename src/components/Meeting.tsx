"use client";
import { socket } from "@/utils/socket";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

const App: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const room = id;

  const [messages, setMessages] = useState<string[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  console.log(socket);

  useEffect(() => {
    socket.on("message", (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on(
      "request-permission",
      ({ userName, room }: { userName: string; room: string }) => {
        const approved = window.confirm(
          `${userName} wants to join room ${room}. Allow?`
        );
        socket.emit("permission-response", { room, userName, approved });
      }
    );

    socket.on("join-approved", ({ approved }: { approved: boolean }) => {
      setPermissionGranted(approved);
      if (approved) {
        startVideoChat();
      }
    });

    socket.on("offer", async (data: { sdp: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", { room, answer });
      }
    });

    socket.on("answer", async (data: { sdp: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );
      }
    });

    socket.on("candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startVideoChat = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    const peerConnection = new RTCPeerConnection();
    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));
    peerConnectionRef.current = peerConnection;

    peerConnection.ontrack = ({ streams: [stream] }) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("candidate", { room, candidate });
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { room, sdp: offer });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Video App</h1>
      <div className="mt-4">
        {messages.map((msg, idx) => (
          <p key={idx} className="text-gray-700">
            {msg}
          </p>
        ))}
      </div>
      <div className="mt-4 flex space-x-4">
        {permissionGranted && (
          <>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-1/2 border rounded"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-1/2 border rounded"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
