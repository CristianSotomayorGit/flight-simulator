import React, { useRef } from "react";
import styles from "./WebGLCanvas.module.css";
import { useWebGL } from "../../hooks";

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { rendererRef, didLoad, initializationError } = useWebGL(canvasRef);
  console.log(rendererRef, didLoad, initializationError);

  return (

      <canvas ref={canvasRef} className={styles.canvas} width="1000px" height="1000px"></canvas>

  );
};

export default WebGLCanvas;
