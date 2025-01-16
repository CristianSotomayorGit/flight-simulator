import React, { useRef } from "react";
import { useWebGL } from "../../hooks";

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useWebGL(canvasRef);

  return (
      <canvas ref={canvasRef} width="800px" height="800px"></canvas>
  );
};

export default WebGLCanvas;
