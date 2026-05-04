"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSocket } from "../../../hooks/useSocket";
import { useParams } from "next/navigation";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    };

let startX = 0;
let startY = 0;
let centerX = 0;
let centerY = 0;
let radius = 0;
let width = 0;
let height = 0;
let clicked = false;

function draw(ctx: CanvasRenderingContext2D,shapes:Shape[],canvas: HTMLCanvasElement) {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  shapes.forEach((e) => {
    if (e.type === "rect") {
      ctx.strokeRect(e.x, e.y, e.width, e.height);
    } else if (e.type === "circle") {
      ctx.beginPath();
      ctx.arc(e.centerX, e.centerY, e.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(e.startX, e.startY);
      ctx.lineTo(e.endX, e.endY);
      ctx.stroke();
    }
  });
}

export default function Canvas() {
  const canvasref = useRef<HTMLCanvasElement>(null);
  const [shapeType, setShapeType] = useState<"circle" | "rectangle" | "line">(
    "circle",
  );
  const { socket, loading } = useSocket();
  const shapeTypeRef = useRef(shapeType);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapesRef = useRef<Shape[]>([]);
  const params = useParams();
  const roomId = params.roomid;
  const [sendShapes, setSendShapes] = useState(false);


  //send and recieve data via socket
  useEffect(() => {
    if (socket && !loading) {
      socket.send(
        JSON.stringify({
          type: "join-room",
          roomId: roomId,
        }),
      );

      socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        console.log("data recieved")

        if (parsedData.type === "draw") {
          setShapes(parsedData.shapes);
          setSendShapes(true);
        }
      };
    }
  }, [socket, loading,roomId]);

  // update shapeTypeRef when shapeType changes
  useEffect(() => {
    shapeTypeRef.current = shapeType;
  }, [shapeType]);

  // update shapesRef when shapes changes
  useEffect(() => {
    if (canvasref.current) {
      const canvas = canvasref.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        shapesRef.current = shapes;
        draw(ctx, shapes, canvas);
        setSendShapes(false);

        if (socket && !loading && !sendShapes) {
          socket.send(
            JSON.stringify({
              type: "draw",
              roomId: roomId,
              shapes: shapes,
            }),
          );
        }
      }
    }
  }, [shapes,socket]);

    useEffect(() => {
      if (canvasref.current) {
        const canvas = canvasref.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return;
        }

        canvas.addEventListener("mousedown", (e) => {
          clicked = true;
          startX = e.clientX;
          startY = e.clientY;
        });

        canvas.addEventListener("mouseup", (e) => {
          clicked = false;

          if (shapeTypeRef.current == "rectangle") {
            setShapes((prevShapes) => [
              ...prevShapes,
              { type: "rect", x: startX, y: startY, width, height },
            ]);

          } else if (shapeTypeRef.current == "circle") {
            setShapes((prevShapes) => [
              ...prevShapes,
              { type: "circle", centerX, centerY, radius },
            ]);
          } else {
            setShapes((prevShapes) => [
              ...prevShapes,
              { type: "line", startX, startY, endX: e.clientX, endY: e.clientY },
            ]);
          }

        });

        canvas.addEventListener("mousemove", (e) => {
          if (clicked) {
            
            width = e.clientX - startX;
            height = e.clientY - startY;

            draw(ctx, shapesRef.current,canvas);

            if (shapeTypeRef.current == "rectangle") {
              ctx.strokeRect(startX, startY, width, height);
            } else if (shapeTypeRef.current == "circle") {
              radius = Math.sqrt(width ** 2 + height ** 2) / 2;
              centerX = startX + width / 2;
              centerY = startY + height / 2;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(e.clientX, e.clientY);
              ctx.stroke();
            }
          }
        });
      }
    }, []);

  // resize canvas on window resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasref.current) return;

      const canvas = canvasref.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        draw(ctx, shapes, canvas);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <div className="">
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setShapeType("circle")}
        >
          Circle
        </button>
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setShapeType("rectangle")}
        >
          Rectangle
        </button>

        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setShapeType("line")}
        >
          Line
        </button>
      </div>

      <canvas
        ref={canvasref}
        height={window.innerHeight}
        width={window.innerWidth}
        className="border-2 border-black"
      />
    </div>
  );
}
