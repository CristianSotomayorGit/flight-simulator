import { useEffect, useRef } from "react";

export const useKeys = () => {
  const keysPressedRef = useRef(new Set<string>());

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

  return keysPressedRef;
};
