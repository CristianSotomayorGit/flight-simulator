import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Compass, CenteredColumn, WebGLCanvas } from "./components";
import { useWebGL } from "./hooks";

const technologies = ["React", "WebGL", "Typescript"];
const controls = [
  { key: "Up", action: "Accelerate" },
  { key: "Down", action: "Decelerate" },
  { key: "Left", action: "Turn Left" },
  { key: "Right", action: "Turn Right" },
  { key: "Space", action: "Pause" },
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressedRef = useRef(new Set<string>()); // Track pressed keys
  const [angle, setAngle] = useState(2.23);
  const [scale, setScale] = useState(0.009);
  const [moveSpeed, setMoveSpeed] = useState(0);
  const [takeOffCounter, setTakeOffCounter] = useState(0);

  const { rendererRef } = useWebGL(canvasRef);

  useEffect(() => {
    if (takeOffCounter < 2000) {
      const interval = setInterval(() => {
        setTakeOffCounter((prev) => prev + 1);

        setMoveSpeed((prev) =>
          takeOffCounter < 2000 ? prev + 0.0001 / 2000 : prev
        );

        if (takeOffCounter > 800 && scale < 0.15) {
          setScale((prev) => prev + 0.15 / 1200);
        }
        if (takeOffCounter > 1000) {
          setAngle((prev) => prev - 1.3 / 1000);
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [takeOffCounter, scale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressedRef.current.add(event.key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressedRef.current.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const keysPressed = keysPressedRef.current;

      setAngle((prev) => {
        let newAngle = prev;
        if (keysPressed.has("ArrowLeft")) newAngle += 0.008;
        if (keysPressed.has("ArrowRight")) newAngle -= 0.008;
        return newAngle;
      });

      setMoveSpeed((prev) => {
        let newMoveSpeed = prev;
        if (keysPressed.has("ArrowUp"))
          newMoveSpeed = Math.min(newMoveSpeed + 0.0003 / 300, 0.0003);
        if (keysPressed.has("ArrowDown"))
          newMoveSpeed = Math.max(newMoveSpeed - 0.0003 / 300, 0.000005);
        return newMoveSpeed;
      });

      setScale((prev) => {
        let newScale = prev;
        if (keysPressed.has("w")) newScale *= 1.02;
        if (keysPressed.has("s")) newScale /= 1.02;
        return newScale;
      });
    }, 16);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (rendererRef.current)
      rendererRef.current.updateState({ angle, scale, moveSpeed });
  }, [angle, scale, moveSpeed, rendererRef]);

  const infos = [
    { key: "Speed", value: (moveSpeed * 3500000).toFixed(0), symbol: "Knots" },
    {
      key: "Elevation",
      value: ((scale - 0.009) * 17730496).toFixed(0),
      symbol: "Feet",
    },
    { key: "Yaw", value: angle.toFixed(2) },
  ];

  return (
    <div style={{ transform: "scale(0.7)" }}>
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
}

export default App;
