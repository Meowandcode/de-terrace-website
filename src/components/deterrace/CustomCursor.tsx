import { useEffect, useRef, useState } from "react";

import idle from "@/assets/cursor-idle.png";
import hover from "@/assets/cursor-hover.png";

/** Coffee-cup cursor. Hidden on touch devices. */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!fine) return;
    let raf = 0;
    let x = 0;
    let y = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      setVisible(true);

      const target = e.target as HTMLElement | null;
      const near = !!target?.closest('.cursor-hover-target, a, button, input, [role="button"]');
      setActive(near);

      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (ref.current) {
            ref.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
          }
        });
      }
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-100 h-10 w-10"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s ease" }}
    >
      <img
        src={idle}
        alt=""
        className="absolute inset-0 h-full w-full object-contain transition-all duration-200"
        style={{ opacity: active ? 0 : 1, transform: active ? "scale(0.8)" : "scale(1)" }}
      />
      <img
        src={hover}
        alt=""
        className="absolute inset-0 h-full w-full object-contain transition-all duration-200"
        style={{ opacity: active ? 1 : 0, transform: active ? "scale(1.15)" : "scale(0.9)" }}
      />
    </div>
  );
}
