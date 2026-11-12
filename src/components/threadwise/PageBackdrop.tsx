export function PageBackdrop({ tone = "light" }: { tone?: "light" | "dark" }) {
  const src = tone === "dark" ? "/world-land-dark.svg" : "/world-land-light.svg";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${src}')`,
          backgroundSize: "min(1700px, 140vw) auto",
          backgroundPosition: "84% 2%",
          backgroundRepeat: "no-repeat",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 52%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 52%, transparent 100%)",
        }}
      />
    </div>
  );
}
