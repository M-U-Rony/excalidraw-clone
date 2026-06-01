"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_BASE_URL } from "@repo/backend-common/config";
export default function Dashboard() {
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  async function createRoom() {
    try {
      const res = await fetch(`${API_BASE_URL}/createroom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: roomName }),
      });

      if (!res.ok) {
        console.error("Failed to create room");
        return;
      }
      const data = await res.json();
      router.push(`/canvas/${data.roomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <input
        type="text"
        placeholder="Room Name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={createRoom}
        className="bg-blue-500 text-white p-2 rounded cursor-pointer"
      >
        create room
      </button>
    </div>
  );
}
