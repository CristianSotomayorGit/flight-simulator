import React from "react";

interface WebGLCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}
const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ canvasRef }) => {
  return <canvas ref={canvasRef} width="800px" height="800px"></canvas>;
};

export default WebGLCanvas;
