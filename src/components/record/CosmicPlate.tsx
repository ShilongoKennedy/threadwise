export function CosmicPlate() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#03040A]" aria-hidden="true">
      <img
        src="/space/pia03654.jpg"
        alt=""
        className="cosmic-drift absolute left-1/2 top-1/2 h-[116%] w-[116%] max-w-none object-cover opacity-100 [filter:saturate(.7)_brightness(1.05)_contrast(1.04)]"
      />
      <img
        src="/space/pia03654.jpg"
        alt=""
        className="cosmic-drift-slow absolute left-1/2 top-1/2 h-[135%] w-[135%] max-w-none object-cover opacity-[0.32] blur-3xl [filter:saturate(.55)_brightness(.8)]"
      />
      <div className="absolute inset-0 bg-[#071229]/18 mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_43%,rgba(5,7,12,0.05)_0%,rgba(5,7,12,0.08)_45%,rgba(5,7,12,0.38)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070C_0%,rgba(5,7,12,0.82)_24%,rgba(5,7,12,0.28)_44%,rgba(5,7,12,0.02)_64%,transparent_82%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_73%_44%,rgba(5,7,12,0.42)_0%,rgba(5,7,12,0.14)_28%,transparent_52%)]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(5,7,12,0.92)_0%,rgba(5,7,12,0.4)_55%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,#05070C_0%,transparent_100%)]" />
    </div>
  );
}
