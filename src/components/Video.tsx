import React, { useRef, useEffect } from "react";

interface VideoProps {
  stream: MediaStream;
  isLocal: boolean;
}

const Video: React.FC<VideoProps> = ({ stream, isLocal }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay muted={isLocal}></video>;
};

export default Video;
