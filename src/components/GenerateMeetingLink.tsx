"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface GenerateMeetingLinkProps {
  name: string;
}

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const GenerateMeetingLink: React.FC<GenerateMeetingLinkProps> = ({ name }) => {
  const [meetingLink, setMeetingLink] = useState<string>("");
  const navigate = useRouter();
  const handleGenerateLink = async (): Promise<void> => {
    try {
      const response = await axios.post(`${baseUrl}/meeting/create`, {
        professorName: name,
      });
      const newMeetingLink = response?.data?.meetingLink;
      setMeetingLink(newMeetingLink);
      navigate.push(newMeetingLink);
    } catch (error) {
      console.error("Error generating meeting link", error);
    }
  };

  return (
    <>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded"
        onClick={handleGenerateLink}
      >
        Generate Meeting Link
      </button>
      {meetingLink && (
        <a href={meetingLink} target="_blank" rel="noopener noreferrer">
          Join Meeting
        </a>
      )}
    </>
  );
};

export default GenerateMeetingLink;
