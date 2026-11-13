export function PageBackdrop({ tone = "light" }: { tone?: "light" | "dark" }) {
  const src = tone === "dark" ? "/world-land-dark.svg" : "/world-land-light.svg";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[640px] overflow-hidden">
      <div
        className={`absolute inset-0 ${
          tone === "dark"
            ? "bg-[radial-gradient(ellipse_at_82%_0%,rgba(194,137,79,0.16),transparent_54%)]"
            : "bg-[radial-gradient(ellipse_at_82%_0%,rgba(225,174,112,0.2),transparent_52%),linear-gradient(180deg,rgba(250,242,229,0.66),transparent_62%)]"
        }`}
      />
      <div
        className={`absolute inset-0 ${tone === "dark" ? "opacity-40" : "opacity-70"}`}
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
