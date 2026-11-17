import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "The reading room — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HeroLab,
});

function StillLife() {
  return (
    <svg className="hero-still" viewBox="0 0 1600 760" aria-hidden="true">
      <defs>
        <linearGradient id="chair-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2ECDD" />
          <stop offset="1" stopColor="#D9D0BC" />
        </linearGradient>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9FF65" />
          <stop offset="1" stopColor="#A8E51D" />
        </linearGradient>
        <radialGradient id="globe-ocean" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#E5DCFF" />
          <stop offset="1" stopColor="#B9A8F2" />
        </radialGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <ellipse cx="995" cy="647" rx="310" ry="42" fill="#1E1A5A" opacity="0.32" filter="url(#soft)" />
      <ellipse cx="330" cy="649" rx="210" ry="28" fill="#1E1A5A" opacity="0.28" filter="url(#soft)" />
      <ellipse cx="1348" cy="666" rx="120" ry="17" fill="#1E1A5A" opacity="0.25" filter="url(#soft)" />

      <g id="archive-boxes">
        <rect x="88" y="430" width="178" height="112" fill="#171821" />
        <rect x="105" y="349" width="164" height="99" fill="#20212B" />
        <rect x="96" y="395" width="181" height="20" fill="#2E2F3B" />
        <rect x="119" y="462" width="94" height="48" fill="#E9E2D2" />
        <path fill="none" d="M128 477h74M128 486h61M128 495h69" stroke="#26232F" strokeWidth="2" opacity="0.6" />
        <path fill="none" d="M134 369h90M134 380h64" stroke="#E9E2D2" strokeWidth="2" opacity="0.7" />
        <path d="M90 542h290l-12 22H74z" fill="#CEC6B5" />
      </g>

      <g id="table-globe">
        <path d="M252 431h74l18 205h-41l-11-161-13 161h-44z" fill="#CFC5B1" />
        <ellipse cx="291" cy="431" rx="122" ry="25" fill="#E9E2D2" />
        <ellipse cx="291" cy="425" rx="122" ry="25" fill="#F3EEDF" />
        <path fill="none" d="M194 424c30-14 115-19 194-1" stroke="#C3B9A4" strokeWidth="3" opacity="0.7" />
        <path fill="none" d="M291 397v-42" stroke="#252136" strokeWidth="7" />
        <path d="M260 352c16-11 44-11 62 0l-5 12h-52z" fill="#252136" />
        <circle cx="291" cy="317" r="67" fill="url(#globe-ocean)" stroke="#2A2444" strokeWidth="2" />
        <ellipse cx="291" cy="317" rx="67" ry="22" fill="none" stroke="#2A2444" strokeWidth="2" opacity="0.75" />
        <ellipse cx="291" cy="317" rx="38" ry="65" fill="none" stroke="#2A2444" strokeWidth="2" opacity="0.75" />
        <path fill="none" d="M224 317h134M239 283h104M239 351h104" stroke="#2A2444" strokeWidth="2" opacity="0.65" />
        <path d="M258 287c22-10 42 2 44 18 2 17-14 23-16 39-2 15 6 24 18 31-23 11-44-1-48-20-4-16 8-27 2-41-4-11-5-20 0-27z" fill="#2A2444" opacity="0.78" />
        <circle cx="318" cy="347" r="4" fill="#C8FF3D" />
      </g>

      <g id="papers">
        <path d="M601 632l163-19 25 52-171 22z" fill="#EDE8DA" stroke="#C6BCA8" strokeWidth="1.4" />
        <path fill="none" d="M620 641l128-15M626 651l120-14M631 661l108-13" stroke="#7A7366" strokeWidth="2" opacity="0.55" />
        <path d="M710 599l122-8 15 39-129 9z" fill="#F4F0E4" stroke="#C6BCA8" strokeWidth="1.2" />
        <path fill="none" d="M727 611l81-5M730 620l73-4" stroke="#7A7366" strokeWidth="2" opacity="0.45" />
      </g>

      <g id="chair">
        <path fill="none" d="M842 595l-13 78M1120 595l16 78" stroke="#343041" strokeWidth="10" strokeLinecap="round" />
        <rect x="850" y="430" width="286" height="120" rx="22" fill="url(#chair-light)" />
        <path d="M862 448c-43-63-7-166 105-166h32c112 0 148 103 105 166l-28 50H890z" fill="url(#chair-light)" />
        <path d="M892 435c-25-48-2-126 80-126h31c82 0 105 78 80 126z" fill="#E4DCCB" />
        <path d="M870 466c-28 2-40 22-33 45l18 57h33l-10-94zM1118 466c28 2 40 22 33 45l-18 57h-33l10-94z" fill="#DDD4C1" />
        <path fill="none" d="M895 530h192" stroke="#C3B9A4" strokeWidth="3" />
        <path fill="none" d="M900 480c29-15 57-18 90-18s61 3 90 18" stroke="#CFC5B1" strokeWidth="2" opacity="0.7" />
        <path d="M930 446c14-27 47-40 81-40s67 13 81 40" fill="none" stroke="#C8FF3D" strokeWidth="4" strokeDasharray="1 12" strokeLinecap="round" />
      </g>

      <g id="lamp">
        <ellipse cx="1348" cy="650" rx="74" ry="14" fill="#252136" />
        <path fill="none" d="M1348 638V278" stroke="#252136" strokeWidth="7" />
        <path d="M1348 294c-39-11-68-46-72-89l140-18c-2 45-26 89-68 107z" fill="url(#shade)" />
        <path fill="none" d="M1276 205c35-14 92-21 140-18" stroke="#252136" strokeWidth="3" opacity="0.5" />
        <circle cx="1348" cy="250" r="11" fill="#F5F1E2" />
        <path fill="none" d="M1290 208c20 21 82 28 130 5" stroke="#F5F1E2" strokeWidth="2" opacity="0.4" />
      </g>
    </svg>
  );
}

function HeroLab() {
  return (
    <div className="hero-lab">
      <header className="hero-nav">
        <Link to="/" className="hero-nav__brand">
          <span className="hero-nav__mark" aria-hidden="true">✦</span>
          THREADWISE
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="hero-nav__index">index <span>—</span></Link>
      </header>

      <main className="hero-main">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-floor" aria-hidden="true" />
        <div className="hero-objects"><StillLife /></div>

        <div className="hero-title-wrap">
          <p className="hero-kicker">A reading desk for sources you do not trust yet.</p>
          <h1 className="hero-title">
            <span className="hero-title__bold">THREAD</span>
            <span className="hero-title__serif">wise</span>
            <span className="hero-title__dot" aria-hidden="true" />
          </h1>
          <p className="hero-sub">Read the evidence. Keep the questions.</p>
        </div>

        <div className="hero-bottom">
          <div className="hero-manifesto">
            <p><span>›</span> a reading room. not a summary machine.</p>
            <p><span>›</span> three instruments. one standard of evidence.</p>
            <p><span>›</span> start with the source you have open in another tab.</p>
            <div className="hero-links">
              <Link to="/analyst">Bring a source <ArrowRight className="h-3 w-3" /></Link>
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }}>Open the IAEA read <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </div>
          <div className="hero-scroll"><span>scroll</span><i /></div>
          <div className="hero-date">18 / 11 / 2026</div>
        </div>
      </main>
    </div>
  );
}
