import { useCallback, useEffect, useRef } from "react";

type Props = {
  text: string;
  className?: string;
  /** Max scale for the letter closest to the cursor. */
  max?: number;
  /** Influence radius in px. */
  radius?: number;
};

/**
 * Magnetic / mouse-parallax headline: letters near the cursor scale up and the
 * surrounding letter-spacing opens up automatically so glyphs never collide.
 */
export function MagneticText({ text, className = "", max = 1.55, radius = 240 }: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const raf = useRef(0);

  const reset = useCallback(() => {
    letterRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = "scale(1)";
      el.style.margin = "0px";
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const wrap = wrapRef.current;
        if (!wrap) return;
        const box = wrap.getBoundingClientRect();
        const inRange =
          e.clientY > box.top - radius &&
          e.clientY < box.bottom + radius &&
          e.clientX > box.left - radius &&
          e.clientX < box.right + radius;
        if (!inRange) {
          reset();
          return;
        }
        letterRefs.current.forEach((el) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const d = Math.hypot(e.clientX - cx, e.clientY - cy);
          const t = Math.max(0, 1 - d / radius);
          const eased = t * t;
          const scale = 1 + (max - 1) * eased;
          el.style.transform = `scale(${scale.toFixed(3)})`;
          const grow = (r.width / Math.max(scale, 0.001)) * (scale - 1) * 0.55;
          el.style.margin = `0 ${grow.toFixed(2)}px`;
        });
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [max, radius, reset]);

  return (
    <span ref={wrapRef} className={`inline-flex flex-wrap items-baseline ${className}`}>
      {text.split("").map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className="inline-block origin-center transition-[transform,margin] duration-300 ease-out"
          style={{ willChange: "transform" }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}
