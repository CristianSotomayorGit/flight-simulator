import { useEffect, useState } from "react";
import { Renderer } from "../renderers/Renderer";

export const useFlightControls = (
  keysPressedRef: React.MutableRefObject<Set<string>>,
  rendererRef: Renderer
) => {
  const [angle, setAngle] = useState(2.23);
  const [scale, setScale] = useState(0.009);
  const [moveSpeed, setMoveSpeed] = useState(0);
  const [takingOff, setTakingOff] = useState(true);

  useEffect(() => {
    if (rendererRef) {
      rendererRef.setUpdateCallback(
        ({ angle, scale, moveSpeed, takingOff }) => {
          setAngle(angle);
          setScale(scale);
          setMoveSpeed(moveSpeed);
          setTakingOff(takingOff);
        }
      );
    }
  }, [rendererRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      const keysPressed = keysPressedRef.current;
      if (!takingOff) {
        setAngle((prev) => {
          let newAngle = prev;
          if (keysPressed.has("ArrowLeft")) newAngle += 0.008;
          if (keysPressed.has("ArrowRight")) newAngle -= 0.008;
          return newAngle;
        });

        setMoveSpeed((prev) => {
          let newMoveSpeed = prev;
          if (keysPressed.has("ArrowUp"))
            newMoveSpeed = Math.min(newMoveSpeed + 0.0003 / 300, 0.0003 * 5);
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
      }
    }, 16);

    return () => clearInterval(interval);
  }, [keysPressedRef, takingOff]);

  useEffect(() => {
    if (rendererRef) {
      rendererRef.angle = angle;
      rendererRef.scale = scale;
      rendererRef.moveSpeed = moveSpeed;
    }
  }, [angle, moveSpeed, scale]);

  return { angle, scale, moveSpeed };
};
