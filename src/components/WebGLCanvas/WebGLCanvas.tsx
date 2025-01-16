import React, { useRef } from "react";
import styles from "./WebGLCanvas.module.css";
import { useWebGL } from "../../hooks/useWebGL";

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { rendererRef, didLoad, initializationError } = useWebGL(canvasRef);
  console.log(rendererRef, didLoad, initializationError);

  return (
    <div>
      <canvas ref={canvasRef} className={styles.canvas}></canvas>
    </div>
  );
};

export default WebGLCanvas;
