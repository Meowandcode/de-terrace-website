import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { CustomCursor } from "@/components/deterrace/CustomCursor";
import { MagneticText } from "@/components/deterrace/MagneticText";
import { MenuDetail } from "@/components/deterrace/MenuDetail";
import { OrderSection } from "@/components/deterrace/OrderSection";
import {
  MENU,
  emailUrl,
  instagramUrl,
  mapsUrl,
  whatsappUrl,
  type CartLine,
  type MenuItem,
} from "@/lib/deterrace";

import cup from "@/assets/cup-top2.png";
import doorClosed from "@/assets/door-closed.jpg";
import doorOpen from "@/assets/door-open.jpg";
import interior from "@/assets/interior.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "De Terrace — Coffee Shop & Terrace Cafe" },
      {
        name: "description",
        content:
          "Step inside De Terrace: a calm, cinematic coffee shop. Browse coffee, non coffee and foods, then order straight through WhatsApp.",
      },
      { property: "og:title", content: "De Terrace — Coffee Shop & Terrace Cafe" },
      {
        property: "og:description",
        content:
          "Open the door, walk in, and brew your moment. Menu, ordering and contact for De Terrace coffee shop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "loading" | "landing" | "entering" | "inside";

function Index() {
  const [stage, setStage] = useState<Stage>("loading");
  const [doorHover, setDoorHover] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const lenisRef = useRef<{ destroy: () => void } | null>(null);

  /* Loading screen: spin the cup while the heavy photos preload. */
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setStage("landing");
    };
    const sources = [doorClosed, doorOpen, interior];
    let left = sources.length;
    sources.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        left -= 1;
        if (left === 0) window.setTimeout(finish, 700);
      };
      img.src = src;
    });
    const failsafe = window.setTimeout(finish, 5000);
    return () => window.clearTimeout(failsafe);
  }, []);

  /* Heavy, premium inertia scroll once the visitor is inside. */
  useEffect(() => {
    if (stage !== "inside") return;
    let cancelled = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ duration: 2.4, wheelMultiplier: 0.7, touchMultiplier: 1.1 });
      lenisRef.current = lenis as unknown as { destroy: () => void };
      let id = 0;
      const raf = (t: number) => {
        lenis.raf(t);
        id = requestAnimationFrame(raf);
      };
      id = requestAnimationFrame(raf);
      (lenis as unknown as { _dtStop?: () => void })._dtStop = () => cancelAnimationFrame(id);
    });
    return () => {
      cancelled = true;
      const l = lenisRef.current as null | { destroy: () => void; _dtStop?: () => void };
      l?._dtStop?.();
      l?.destroy();
      lenisRef.current = null;
    };
  }, [stage]);

  const intro = stage !== "inside";

  /* Lock the page while the intro plays. */
  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [intro]);

  const goInside = useCallback(() => {
    setStage("entering");
    window.setTimeout(() => setStage("inside"), 1500);
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((l) => l.id === item.id);
      if (found) {
        return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <CustomCursor />

      {/* Section 1 — Loading screen */}
      {stage === "loading" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-coffee-dark">
          <img
            src={cup}
            alt="De Terrace"
            width={1024}
            height={1024}
            className="animate-dt-spin h-32 w-32 object-contain md:h-40 md:w-40"
          />
        </div>
      )}

      {/* Sections 2 & 3 — Landing exterior + enter transition */}
      {(stage === "landing" || stage === "entering") && (
        <div
          className="animate-dt-fade fixed inset-0 z-40 overflow-hidden bg-coffee-dark"
          onMouseLeave={() => setDoorHover(false)}
        >
          <div
            className="h-full w-full transition-transform duration-1500 ease-in"
            style={{
              transform: stage === "entering" ? "scale(2.6)" : "scale(1)",
              opacity: stage === "entering" ? 0 : 1,
              transitionProperty: "transform, opacity",
            }}
          >
            <img
              src={doorClosed}
              alt="De Terrace storefront with closed glass doors"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in"
              style={{ opacity: doorHover || stage === "entering" ? 0 : 1 }}
            />
            <img
              src={doorOpen}
              alt="De Terrace storefront with open glass doors"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in"
              style={{ opacity: doorHover || stage === "entering" ? 1 : 0 }}
            />
            <div
              className="absolute inset-0 bg-coffee-dark transition-opacity duration-700 ease-in"
              style={{ opacity: doorHover || stage === "entering" ? 0.45 : 0 }}
            />
          </div>

          {/* Door hotspot */}
          <button
            onMouseEnter={() => setDoorHover(true)}
            onFocus={() => setDoorHover(true)}
            onClick={goInside}
            className="cursor-hover-target absolute left-1/2 top-1/2 h-[70%] w-[42%] -translate-x-1/2 -translate-y-1/2"
            aria-label="Go inside De Terrace"
          >
            <span
              className="text-3xl font-light text-cream transition-all duration-700 ease-in md:text-5xl"
              style={{
                opacity: doorHover && stage === "landing" ? 1 : 0,
                display: "block",
              }}
            >
              Go inside
            </span>
          </button>
        </div>
      )}

      {/* Sections 4–9 — stacked, full-viewport story */}
      <main
        className={intro ? "pointer-events-none h-screen overflow-hidden opacity-0" : "relative"}
      >
        {/* Section 4 — Hero */}
        <section
          className={
            stage === "inside"
              ? "animate-dt-zoom-out sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden origin-center"
              : "sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden opacity-0 origin-center"
          }
        >
          <img
            src={interior}
            alt="Warm interior of De Terrace with string lights and hanging plants"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-coffee-dark/50" />
          <div className="relative flex flex-col items-center px-6 text-center">
            <h1 className="animate-dt-rise text-[13vw] font-light leading-none tracking-tight text-cream md:text-[9vw]">
              <MagneticText text="De Terrace" />
            </h1>
            <p className="animate-dt-fade mt-6 text-sm font-light text-cream/90 md:mt-10 md:text-base">
              Scroll to order
            </p>
          </div>
        </section>

        {/* Section 5 — Menu navigation */}
        <section className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden bg-cream px-8 md:px-16">
          <h2 className="text-[18vw] font-light leading-[0.85] tracking-tight text-coffee-dark md:text-[13vw]">
            Menu
          </h2>
          <nav className="mt-14 flex flex-col gap-6 md:mt-24 md:flex-row md:items-center md:justify-between">
            {MENU.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className="cursor-hover-target text-2xl font-light text-coffee-dark transition-opacity duration-300 hover:opacity-60 md:text-4xl"
              >
                {cat.title}
              </button>
            ))}
          </nav>
        </section>

        {/* Section 6 — Menu detail, one per category */}
        {MENU.map((cat) => (
          <MenuDetail key={cat.id} category={cat} onOrder={addToCart} />
        ))}

        {/* Section 7 — Brew your moment */}
        <section className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-coffee-dark px-6 text-center">
          <h2 className="text-[15vw] font-light leading-[0.9] tracking-tight text-cream md:text-[10vw]">
            <MagneticText text="Brew" />
          </h2>
          <p className="text-[8vw] font-light leading-none tracking-tight text-cream md:text-[5vw]">
            <MagneticText text="Your Moment" />
          </p>
        </section>

        {/* Section 8 — Order list */}
        <OrderSection lines={cart} />

        {/* Section 9 — Visit */}
        <section className="sticky top-0 flex h-screen w-full items-center overflow-hidden bg-cream px-8 md:px-16">
          <div className="flex w-full flex-col gap-12 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[13vw] font-light leading-[0.9] tracking-tight text-coffee-dark md:max-w-[55%] md:text-[8vw]">
              <div className="flex flex-col">
                <MagneticText text="Visit" />
                <MagneticText text="De" />
                <MagneticText text="Terrace" />
              </div>
            </h2>
            <ul className="space-y-6 text-sm text-coffee-dark md:space-y-12 md:text-base">
              {[
                { label: "Location", href: mapsUrl },
                { label: "Email", href: emailUrl },
                { label: "Instagram", href: instagramUrl },
                { label: "Whatsapp", href: whatsappUrl },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-hover-target transition-opacity duration-300 hover:opacity-60"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
