import Peer from "peerjs";
import SimplePeer, { SignalData } from "simple-peer";

import { Socket, io } from "socket.io-client";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const socket: Socket = io(`${baseUrl}`);
interface CreatePeerOptions {
  stream: MediaStream;
  initiator?: boolean;
  onSignal?: (signal: SignalData) => void;
  onConnect?: () => void;
  onStream?: (remoteStream: MediaStream) => void;
  userToSignal?: string;
  callerId?: string;
  inComingSignal?: any;
}

// export const createPeer = ({
//   initiator,
//   stream,
//   userToSignal,
//   callerId,
//   onConnect,
//   onStream,
// }: CreatePeerOptions): SimplePeer.Instance => {
//   const peer = new SimplePeer({ initiator, trickle: false, stream });

//   peer.on("signal", (signal) => {
//     socket.emit("sending signal", { userToSignal, callerId, signal });
//   });
//   if (onConnect) {
//     peer.on("connect", onConnect);
//   }
//   if (onStream) {
//     peer.on("stream", onStream);
//   }

//   return peer;
// };

export const createPeer = ({
  initiator,
  stream,
  onSignal,
  onConnect,
  onStream,
}: CreatePeerOptions): SimplePeer.Instance => {
  const peer = new SimplePeer({ initiator, stream });

  if (onSignal) {
    peer.on("signal", onSignal);
  }
  if (onConnect) {
    peer.on("connect", onConnect);
  }
  if (onStream) {
    peer.on("stream", onStream);
  }

  return peer;
};

export function addPeer({
  stream,
  inComingSignal,
  callerId,
}: CreatePeerOptions) {
  const peer = new SimplePeer({
    initiator: false,
    trickle: false,
    stream,
  });

  peer.on("signal", (signal) => {
    socket.emit("returning signal", { signal, callerId });
  });

  peer.signal(inComingSignal);

  return peer;
}

export const addSignal = (
  peer: SimplePeer.Instance,
  signal: SignalData
): void => {
  peer.signal(signal);
};

export const peer = new Peer({
  host: "localhost",
  port: 5000,
  path: "/",
});
