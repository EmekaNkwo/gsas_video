import Peer from "peerjs";

const connectPeerConnection = new Peer({
  host: "peerjs-server.herokuapp.com", // You can use a custom PeerJS server if needed
  secure: true,
  port: 443,
});

export default connectPeerConnection;
