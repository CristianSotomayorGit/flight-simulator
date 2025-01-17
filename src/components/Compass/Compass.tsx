import React from "react";
import styles from "./Compass.module.css";

type CompassProps = {
  angle: number;
};

const Compass: React.FC<CompassProps> = ({ angle }) => {
  return (
    <div className={styles["compass-container"]}>
      <svg
        className={styles["compass-svg"]}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="#121212"
          stroke="#ccc"
          strokeWidth="2"
        />
        <g
          className={styles.needle}
          style={{ "--angle": `${angle}rad` } as React.CSSProperties}
        >
          <text
            x="50"
            y="12"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            N
          </text>
          <polygon points="50,15 47,50 53,50" fill="red" />
          <polygon points="50,85 47,50 53,50" fill="white" />
        </g>
      </svg>
    </div>
  );
};

export default Compass;
