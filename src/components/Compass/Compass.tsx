import React from "react";
import "./Compass.css";

type CompassProps = {
  angle: number;
};

const Compass: React.FC<CompassProps> = ({ angle }) => {
  return (
    <div className="compass-container">
      <svg
        className="compass-svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circle */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="#121212"
          stroke="#ccc"
          strokeWidth="2"
        />

        {/* Needle */}
        <g
          className="needle"
          style={{
            transform: `rotate(${angle}rad)`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* North Label */}
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
          {/* Arrow */}
          <polygon points="50,15 47,50 53,50" fill="red" />
          {/* Tail */}
          <polygon points="50,85 47,50 53,50" fill="white" />
        </g>
      </svg>
    </div>
  );
};

export default Compass;
