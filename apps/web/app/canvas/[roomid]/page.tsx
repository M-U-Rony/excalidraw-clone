"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../../hooks/useSocket";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "@repo/backend-common/config";

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
    }
  | {
      type: "eraser";
      x: number;
      y: number;
    };

let startX = 0;
let startY = 0;
let centerX = 0;
let centerY = 0;
let radius = 0;
let width = 0;
let height = 0;
let clicked = false;
let panX = 0;
let panY = 0;
let lastX = 0;
let lastY = 0;
let scale = 1;

function draw(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  canvas: HTMLCanvasElement,
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.setTransform(scale, 0, 0, scale, panX, panY);

  shapes.forEach((e) => {
    if (e.type === "rect") {
      ctx.strokeRect(e.x, e.y, e.width, e.height);
    } else if (e.type === "circle") {
      ctx.beginPath();
      ctx.arc(e.centerX, e.centerY, e.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (e.type == "line") {
      ctx.beginPath();
      ctx.moveTo(e.startX, e.startY);
      ctx.lineTo(e.endX, e.endY);
      ctx.stroke();
    }
  });
}

export default function Canvas() {
  const canvasref = useRef<HTMLCanvasElement>(null);
  const [buttonType, setButtonType] = useState<
    "circle" | "rectangle" | "line" | "eraser" | "zoomin" | "zoomout" | "drag"
  >("circle");
  const { socket, loading } = useSocket();
  const shapeTypeRef = useRef(buttonType);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapesRef = useRef<Shape[]>([]);
  const params = useParams();
  const roomId = params.roomid;
  const [sendShapes, setSendShapes] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoomPercent, setZoomPercent] = useState(100);

  function applyTransform() {
    const canvas = canvasref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(scale, 0, 0, scale, panX, panY);
    draw(ctx, shapesRef.current, canvas);
  }

  //fetch existing shapes from server when component mounts
  useEffect(() => {
    const fetchShapes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chats/${roomId}`);
        const data = await response.json();
        setShapes(JSON.parse(data[0].shapes));
      } catch (error) {
        console.log("Error fetching shapes:", error);
      }
    };

    fetchShapes();
  }, [roomId]);

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

        if (parsedData.type === "draw" && !sendShapes) {
          setShapes(parsedData.shapes);
          setSendShapes(true);
        }
      };
    }
  }, [socket, loading, roomId]);

  // update shapeTypeRef when shapeType changes
  useEffect(() => {
    shapeTypeRef.current = buttonType;
  }, [buttonType]);

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
          // console.log("Sending shapes:", shapes);
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
  }, [shapes, socket]);

  useEffect(() => {
    const canvas = canvasref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      clicked = true;
      startX = (e.clientX - panX) / scale;
      startY = (e.clientY - panY) / scale;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
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
      } else if (shapeTypeRef.current == "line") {
        setShapes((prevShapes) => [
          ...prevShapes,
          {
            type: "line",
            startX,
            startY,
            endX: (e.clientX - panX) / scale,
            endY: (e.clientY - panY) / scale,
          },
        ]);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (clicked) {
        const currentX = (e.clientX - panX) / scale;
        const currentY = (e.clientY - panY) / scale;

        width = currentX - startX;
        height = currentY - startY;

        draw(ctx, shapesRef.current, canvas);

        if (shapeTypeRef.current == "drag") {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;

          panX += dx;
          panY += dy;

          lastX = e.clientX;
          lastY = e.clientY;

          applyTransform();
          return;
        }

        if (shapeTypeRef.current == "rectangle") {
          ctx.strokeRect(startX, startY, width, height);
        } else if (shapeTypeRef.current == "circle") {
          radius = Math.sqrt(width ** 2 + height ** 2) / 2;
          centerX = startX + width / 2;
          centerY = startY + height / 2;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shapeTypeRef.current == "line") {
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          const currentX = (e.clientX - panX) / scale;
          const currentY = (e.clientY - panY) / scale;
          ctx.lineTo(currentX, currentY);
          ctx.stroke();
        } else {
          const canvasMouseX = (e.clientX - panX) / scale;
          const canvasMouseY = (e.clientY - panY) / scale;

          setShapes((prevShapes) =>
            prevShapes.filter((shape) => {
              if (shape.type === "line") {
                const dx = shape.endX - shape.startX;
                const dy = shape.endY - shape.startY;
                const lineLength = Math.sqrt(dx * dx + dy * dy);

                const cross =
                  dx * (canvasMouseY - shape.startY) -
                  (canvasMouseX - shape.startX) * dy;

                const distance = Math.abs(cross) / lineLength;

                const withinX =
                  canvasMouseX >= Math.min(shape.startX, shape.endX) - 10 &&
                  canvasMouseX <= Math.max(shape.startX, shape.endX) + 10;
                const withinY =
                  canvasMouseY >= Math.min(shape.startY, shape.endY) - 10 &&
                  canvasMouseY <= Math.max(shape.startY, shape.endY) + 10;

                if (distance <= 8 && withinX && withinY) return false;
              } else if (shape.type === "circle") {
                const dx = canvasMouseX - shape.centerX;
                const dy = canvasMouseY - shape.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (Math.abs(distance - shape.radius) <= 8) return false;
              } else if (shape.type === "rect") {
                const { x, y, width, height } = shape;
                const threshold = 8;

                const onTopEdge =
                  Math.abs(canvasMouseY - y) <= threshold &&
                  canvasMouseX >= x &&
                  canvasMouseX <= x + width;

                const onBottomEdge =
                  Math.abs(canvasMouseY - (y + height)) <= threshold &&
                  canvasMouseX >= x &&
                  canvasMouseX <= x + width;

                const onLeftEdge =
                  Math.abs(canvasMouseX - x) <= threshold &&
                  canvasMouseY >= y &&
                  canvasMouseY <= y + height;

                const onRightEdge =
                  Math.abs(canvasMouseX - (x + width)) <= threshold &&
                  canvasMouseY >= y &&
                  canvasMouseY <= y + height;

                if (onTopEdge || onBottomEdge || onLeftEdge || onRightEdge)
                  return false;
              }
              return true;
            }),
          );
        }
      }
    };

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      panX -= e.deltaX;
      panY -= e.deltaY;
      applyTransform();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("wheel", handleScroll);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("wheel", handleScroll);
    };
  }, []);

  // resize canvas on window resize
  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  function zoomAt(centerX: number, centerY: number, factor: number) {
    const canvasX = (centerX - panX) / scale;
    const canvasY = (centerY - panY) / scale;

    scale *= factor;

    panX = centerX - canvasX * scale;
    panY = centerY - canvasY * scale;

    applyTransform();
    setZoomPercent(Math.round(scale * 100));
  }

  const handleZoomIn = () => {
    const canvas = canvasref.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    zoomAt(centerX, centerY, 1.2);
  };

  const handleZoomOut = () => {
    const canvas = canvasref.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    zoomAt(centerX, centerY, 0.8);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-50">
      {/* Top Floating Toolbar (Middle of the screen) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 p-1.5 rounded-2xl shadow-lg transition-all duration-300">
        <button
          title="Circle"
          className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
            buttonType === "circle"
              ? "bg-violet-50 text-violet-600 border-violet-500 shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
          }`}
          onClick={() => setButtonType("circle")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>

        <button
          title="Rectangle"
          className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
            buttonType === "rectangle"
              ? "bg-violet-50 text-violet-600 border-violet-500 shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
          }`}
          onClick={() => setButtonType("rectangle")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>

        <button
          title="Line"
          className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
            buttonType === "line"
              ? "bg-violet-50 text-violet-600 border-violet-500 shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
          }`}
          onClick={() => setButtonType("line")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="4" y1="20" x2="20" y2="4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <button
          title="Eraser"
          className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
            buttonType === "eraser"
              ? "bg-violet-50 text-violet-600 border-violet-500 shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
          }`}
          onClick={() => setButtonType("eraser")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L21 6C22 7 22 9 21 10L12 19M17 17L12 12" />
          </svg>
        </button>

        <button
          title="Drag"
          className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
            buttonType === "drag"
              ? "bg-violet-50 text-violet-600 border-violet-500 shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
          }`}
          onClick={() => setButtonType("drag")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 2a2 2 0 0 1 2 2v8a1 1 0 0 0 2 0v-1.5a1.5 1.5 0 0 1 3 0v4.5A7.5 7.5 0 0 1 11.5 22h-1A7.5 7.5 0 0 1 3 14.5v-3a1.5 1.5 0 0 1 3 0V12a1 1 0 0 0 2 0V5.5a1.5 1.5 0 0 1 3 0V12a1 1 0 0 0 2 0V4a2 2 0 0 1 2-2z" />
          </svg>
        </button>
      </div>

      {/* Bottom Left Zoom Controls */}
      <div className="absolute bottom-6 left-6 z-50 flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 p-1.5 rounded-xl shadow-lg">
        <button
          title="Zoom Out"
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all duration-150 border-2 border-transparent"
          onClick={handleZoomOut}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-12 text-center select-none">
          {zoomPercent}%
        </span>

        <button
          title="Zoom In"
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all duration-150 border-2 border-transparent"
          onClick={handleZoomIn}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <canvas
        ref={canvasref}
        height={size.height}
        width={size.width}
        className={`w-full h-full block bg-zinc-50 ${
          buttonType === "drag" ? "cursor-grab" : "cursor-crosshair"
        }`}
      />
    </div>
  );
}

//Problems:
// line draw isn't working properly when zoomed circle works fine when zoomed
// have to sent zoomin,zoomout,scale,currentx,currenty in server
// add zoom percentage display
// send curent pan and zoom to new users when they join
// eraser not working with multiusers
// ws coonection closed after some time of inactivity in prodcution
