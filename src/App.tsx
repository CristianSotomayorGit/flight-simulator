import "./App.css";
import { CenteredColumn, WebGLCanvas } from "./components";


const technologies = ["React", "WebGL", "Typescript"];
const controls = [
  { key: "Up", action: "Accelerate" },
  { key: "Down", action: "Decelerate" },
  { key: "Left", action: "Turn Left" },
  { key: "Right", action: "Turn Right" },
  { key: "Space", action: "Pause" },
];

function App() {
  return (
    <div>
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
        <WebGLCanvas />
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
