import { useEffect, useState } from "react";

export const useFlightControls = (keysPressedRef: React.MutableRefObject<Set<string>>) => {
  const [angle, setAngle] = useState(2.23);
  const [scale, setScale] = useState(0.009);
  const [moveSpeed, setMoveSpeed] = useState(0);
  const [takeOffCounter, setTakeOffCounter] = useState(0);

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
          newMoveSpeed = Math.min(newMoveSpeed + 0.0003 / 300, 0.0003 *5);
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
  }, [keysPressedRef]);

  return { angle, scale, moveSpeed };
};
