import React from "react";
import styles from "./WebGLCanvas.module.css";

const WebGLCanvas: React.FC = () => {
  return (
    <div>
      <canvas className={styles.canvas}></canvas>
    </div>
  );
};

export default WebGLCanvas;
