// "use client";
// import React, { useEffect, useRef, useState } from "react";

// import { useParams } from "next/navigation";
// import { socket } from "@/utils/socket";

// const Meeting: React.FC = () => {
//   const { id } = useParams<{ id: string }>();

//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement>(null);

//   const [peerConnection, setPeerConnection] =
//     useState<RTCPeerConnection | null>(null);
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [audioEnabled, setAudioEnabled] = useState(true);

//   useEffect((): (() => void) => {
//     const pc = new RTCPeerConnection();
//     setPeerConnection(pc);
//     pc.onicecandidate = (event: RTCPeerConnectionIceEvent): void => {
//       if (event.candidate) {
//         socket.emit("candidate", {
//           room: id,
//           candidate: event.candidate,
//         });
//       }
//     };
//     pc.ontrack = (event: RTCTrackEvent): void => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((stream: MediaStream): void => {
//         setLocalStream(stream);
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }
//         stream.getTracks().forEach((track) => pc.addTrack(track, stream));
//       })
//       .catch((error: Error): void => {
//         console.error("Error accessing media devices.", error);
//       });

//     socket.emit("interviewJoin", id, );
//     socket.on(
//       "offer",
//       async (data: { offer: RTCSessionDescriptionInit }): Promise<void> => {
//         if (pc.signalingState !== "closed") {
//           await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit("answer", { room: id, answer });
//         }
//       }
//     );

//     socket.on(
//       "answer",
//       async (data: { answer: RTCSessionDescriptionInit }): Promise<void> => {
//         if (pc.signalingState !== "closed") {
//           await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
//         }
//       }
//     );

//     socket.on(
//       "candidate",
//       async (data: { candidate: RTCIceCandidateInit }): Promise<void> => {
//         if (pc.signalingState !== "closed") {
//           await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//         }
//       }
//     );

//     socket.on("user-connected", async (): Promise<void> => {
//       if (pc.signalingState !== "closed") {
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socket.emit("offer", { room: id, offer });
//       }
//     });

//     socket.on("hangup", (): void => {
//       if (pc) {
//         pc.close();
//         setPeerConnection(null);
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log("Socket disconnected");
//     });

//     return (): void => {
//       pc.close();
//       socket.off("offer");
//       socket.off("answer");
//       socket.off("candidate");
//       socket.off("user-connected");
//       socket.off("disconnect");
//     };
//   }, [id]);

//   const toggleVideo = (): void => {
//     if (localStream) {
//       const newVideoEnabled = !videoEnabled; // Store the new value of videoEnabled outside of the loop
//       localStream.getVideoTracks().forEach((track) => {
//         track.enabled = newVideoEnabled;
//       });
//       setVideoEnabled(newVideoEnabled); // Call setVideoEnabled with the new value
//     }
//   };

//   const toggleAudio = (): void => {
//     if (localStream) {
//       localStream.getAudioTracks().forEach((track) => {
//         track.enabled = !track.enabled;
//         setAudioEnabled(track.enabled);
//       });
//     }
//   };
//   console.log(remoteVideoRef);

//   return (
//     <div className="flex flex-col justify-center items-center h-screen">
//       <div className="grid grid-cols-2">
//         <video ref={localVideoRef} autoPlay muted playsInline />
//         <video ref={remoteVideoRef} autoPlay playsInline />
//       </div>
//       <div className="mt-4 flex gap-3 items-center">
//         <button onClick={toggleVideo}>
//           {videoEnabled ? "Stop Video" : "Start Video"}
//         </button>
//         <button onClick={toggleAudio}>
//           {audioEnabled ? "Mute" : "Unmute"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Meeting;
"use client";
import { socket } from "@/utils/socket";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useRef, ChangeEvent } from "react";

// interface UserSocket extends Socket {
//   userName?: string;
// }

// const socket: UserSocket = io("http://localhost:3000"); // Adjust the backend URL as needed

const App: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const room = id;
  // const [room, setRoom] = useState<string>("");
  // const [userName, setUserName] = useState<string>("");

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
