"use client";
import { baseUrl } from "@/components/GenerateMeetingLink";
import { socket } from "@/utils/socket";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Page = () => {
  const [name, setName] = useState<string>("");
  const router = useRouter();
  const room = "985fec6b-3c47-4c49-ace8-eff8c88f3108";
  const handleJoinLink = async (): Promise<void> => {
    try {
      await axios.post(`${baseUrl}/meeting/join/${room}`, {
        professorName: name,
      });

      socket.emit("interviewJoin", room, name);

      router.push("/" + room);
    } catch (error) {
      console.error("Error generating meeting link", error);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 gap-2">
      <input
        type="text"
        className="border p-2"
        placeholder="Username"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={handleJoinLink}
        className="bg-blue-500 text-white py-2 px-4 rounded"
      >
        Join
      </button>
    </div>
  );
};

export default Page;
