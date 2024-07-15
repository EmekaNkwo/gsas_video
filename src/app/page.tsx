"use client";
import ConnectPeer from "@/components/ConnectPeer";
import FileTransfer from "@/components/FileTransfer";
import GenerateMeetingLink from "@/components/GenerateMeetingLink";
import VideoCall from "@/components/VideoCall";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [applicationId, setApplicationId] = useState<string>("");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 gap-2">
      {/* <input
        type="text"
        className="border border-gray-300 rounded-md p-2"
        placeholder="Enter Professor Name"
        value={applicationId}
        onChange={(e) => setApplicationId(e.target.value)}
      />
      <GenerateMeetingLink name={applicationId} /> */}

      <ConnectPeer />
      {/* <FileTransfer /> */}
      {/* <VideoCall /> */}
    </main>
  );
}
