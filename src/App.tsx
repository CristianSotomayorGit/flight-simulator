import { useEffect, useRef } from "react";
import "./App.css";
import { Compass, CenteredColumn, WebGLCanvas } from "./components";
import { useWebGL } from "./hooks";
import { useKeys } from "./hooks/useKeys";
import { useFlightControls } from "./hooks/useFlightControls";
import { getYawDisplay } from "./utils/yawUtils";

const technologies = ["React", "WebGL", "Typescript"];
const controls = [
  { key: "Up", action: "Accelerate" },
  { key: "Down", action: "Decelerate" },
  { key: "Left", action: "Turn Left" },
  { key: "Right", action: "Turn Right" },
  { key: "Space", action: "Pause" },
];

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressedRef = useKeys();
  const { rendererRef } = useWebGL(canvasRef);
  const { angle, scale, moveSpeed } = useFlightControls(
    keysPressedRef,
    rendererRef.current!
  );

  const infos = [
    { key: "Speed", value: (moveSpeed * 3500000).toFixed(0), symbol: "Knots" },
    {
      key: "Elevation",
      value: ((scale - 0.009) * 177304).toFixed(0),
      symbol: "Feet",
    },
    {
      key: "Yaw",
      value: getYawDisplay(angle),
    },
  ];

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      if (rendererRef.current)
        rendererRef.current.paused = !rendererRef.current?.paused;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div style={{ transform: "scale(0.8)" }}>
      <div className="subtitle">
        <p>Built with</p>
        {technologies.map((tech, index) => (
          <p key={index} className="tech-name">
            {tech}
            {index < technologies.length - 1 && ","}
          </p>
        ))}
      </div>
      <CenteredColumn>
        <p className="title">Flight Simulator Demo:</p>
        <WebGLCanvas canvasRef={canvasRef} />
      </CenteredColumn>
      <CenteredColumn>
        <div className="hud">
          {infos.map(({ key, value, symbol }, index) => (
            <p key={index} className="info">
              <strong>{key}:</strong> {value} {symbol}
            </p>
          ))}
          <Compass angle={angle} />
        </div>
      </CenteredColumn>
      <CenteredColumn>
        <div className="instructions">
          {controls.map(({ key, action }, index) => (
            <p key={index} className="control">
              <strong>{key}:</strong> {action}
            </p>
          ))}
        </div>
      </CenteredColumn>
    </div>
  );
};

export default App;
