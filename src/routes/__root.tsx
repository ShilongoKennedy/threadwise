import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  ClientOnly,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { BLUEPRINT_PALETTE, fieldColorAt } from "@/lib/threadwise/palette";
import { bpButtonClass } from "@/components/threadwise/BlueprintUI";
import { PaperAnnotations } from "@/components/threadwise/PaperAnnotations";
const CloudSync = lazy(() => import("@/components/threadwise/CloudSync"));

function NotFoundComponent() {
  return (
    <div className="blueprint-page relative flex min-h-[100dvh] items-center justify-center px-4" style={{ backgroundColor: "#000000", color: "#FFFFFF" }}>
      <div className="bp-card relative z-10 w-full max-w-[460px] p-7 md:p-8">
        <p className="bp-card__eyebrow">File not found</p>
        <h1 className="mt-4 font-display text-[64px] leading-none">404</h1>
        <p className="mt-4 font-serif text-[15px] leading-[1.65] text-white/75">
          Nothing is filed at this address. It may have been renamed, revoked, or never existed.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link to="/" className={bpButtonClass({ variant: "primary" })}>
            Back to Threadwise
          </Link>
          <Link to="/analyst" className={bpButtonClass({ variant: "secondary" })}>
            Ask the analyst
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const detail = error instanceof Error ? error.message : String(error);
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="blueprint-page relative flex min-h-[100dvh] items-center justify-center px-4" style={{ backgroundColor: "#000000", color: "#FFFFFF" }}>
      <div className="bp-card relative z-10 w-full max-w-[480px] p-7 text-center md:p-8">
        <p className="bp-card__eyebrow">Something interrupted the record</p>
        <h1 className="mt-4 font-display text-[42px] leading-none">This page didn’t load.</h1>
        <p className="mt-3 font-serif text-[15px] leading-[1.65] text-white/72">
          Something went wrong on our end. You can try again or head back to the desk.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md border border-white/15 bg-black/20 p-3 text-left font-mono text-[12px] leading-relaxed text-white/70">
            {detail}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button onClick={() => { void router.invalidate(); reset(); }} className={bpButtonClass({ variant: "primary" })}>
            Try again
          </button>
          <a href="/" className={bpButtonClass({ variant: "secondary" })}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Threadwise" },
      { name: "description", content: "A visual workspace for connected thinking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#FDFBF7" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/fraunces-normal-300-600-latin.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/instrument-sans-normal-400-latin.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/fraunces-italic-300-600-latin.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/ttf",
        href: "/fonts/dancing-script-600.ttf",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/brand/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-surface="paper">
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#main" className="tw-skip-link">
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function SiteBlueprint({ children }: { children: ReactNode }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const tone = BLUEPRINT_PALETTE[0];
  const darkInk = false;

  useEffect(() => {
    const root = fieldRef.current;
    if (!root) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / max));
      root.style.backgroundColor = fieldColorAt(progress);
      root.style.color = "#FFFFFF";
      root.style.setProperty("--site-bg", fieldColorAt(progress));
      root.style.setProperty("--site-ink", "#FFFFFF");
      root.style.setProperty("--site-accent", "#C8FF3D");
      root.style.setProperty("--site-header-ink", "#FFFFFF");
      root.style.setProperty("--site-header-border", "rgba(255,255,255,0.16)");
      root.style.setProperty("--site-brand-filter", "brightness(0) invert(1)");
      root.style.setProperty("--wave-art", 'url("/blueprint-waves.svg")');
      root.style.setProperty("--wave-opacity", "0.72");
      root.dataset.fieldInk = "dark";
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className="site-blueprint scroll-field"
      data-field-ink={darkInk ? "light" : "dark"}
      style={{
        "--site-bg": tone.hex,
        "--site-ink": tone.ink,
        "--wave-art": tone.wave === "dark" ? 'url("/blueprint-waves-bright.svg")' : 'url("/blueprint-waves.svg")',
        "--wave-opacity": tone.wave === "dark" ? "0.7" : "0.72",
        "--site-header-bg": "rgba(255, 255, 255, 0.035)",
        "--site-header-border": darkInk ? "rgba(17, 17, 17, 0.22)" : "rgba(255, 255, 255, 0.16)",
        "--site-header-ink": tone.ink,
        "--site-brand-filter": darkInk ? "brightness(0)" : "brightness(0) invert(1)",
        "--site-accent": "#C8FF3D",
      } as CSSProperties}
    >
      {children}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const keepsOwnField = pathname === "/" || pathname.startsWith("/landing") || pathname.startsWith("/seminar") || pathname === "/lab/landing" || pathname === "/lab/reading-test";

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {keepsOwnField ? <Outlet /> : <SiteBlueprint><Outlet /></SiteBlueprint>}
      <PaperAnnotations />
      <Toaster />
      <ClientOnly fallback={null}><Suspense fallback={null}><CloudSync /></Suspense></ClientOnly>
    </QueryClientProvider>
  );
}
