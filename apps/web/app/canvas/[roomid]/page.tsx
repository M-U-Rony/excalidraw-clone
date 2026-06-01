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
    <div className="">
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setButtonType("circle")}
        >
          Circle
        </button>
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setButtonType("rectangle")}
        >
          Rectangle
        </button>

        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setButtonType("line")}
        >
          Line
        </button>
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setButtonType("eraser")}
        >
          Eraser
        </button>
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => {
            setButtonType("zoomin");
            handleZoomIn();
          }}
        >
          Zoom In
        </button>
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => {
            setButtonType("zoomout");
            handleZoomOut();
          }}
        >
          Zoom Out
        </button>
        <button
          className="cursor-pointer bg-violet-500 text-white px-4 py-2 rounded"
          onClick={() => setButtonType("drag")}
        >
          Drag
        </button>
      </div>

      <canvas
        ref={canvasref}
        height={size.height}
        width={size.width}
        className={`border-2 border-black ${buttonType === "drag" ? "cursor-grab" : "cursor-crosshair"}`}
      />
    </div>
  );
}

//Problems:
// line draw isn't working properly when zoomed
// sometimes when refresh it send empty shapes to server which causes all shapes to disappear
// have to sent zoomin,zoomout,scale,currentx,currenty in server
// add zoom percentage display
