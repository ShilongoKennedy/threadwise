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
import { lazy, Suspense, useEffect, useState, type CSSProperties, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { paletteFor } from "@/lib/threadwise/palette";
const CloudSync = lazy(() => import("@/components/threadwise/CloudSync"));

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FDFBF7] px-4 text-[#1A1A1A]">
      <div className="w-full max-w-[440px] border-2 border-[#1A1A1A] bg-white p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#1A1A1A]/65">
          File not found
        </p>
        <h1 className="mt-3 font-display text-[52px] leading-none">404</h1>
        <p className="mt-3 font-serif text-[15px] leading-[1.65] text-[#1A1A1A]/80">
          Nothing is filed at this address. It may have been renamed, revoked, or never existed.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/"
            className="inline-flex items-center border-2 border-[#1A1A1A] bg-[#1A1A1A] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:bg-[#1A4BFF] hover:border-[#1A4BFF]"
          >
            Back to Threadwise
          </Link>
          <Link
            to="/analyst"
            className="inline-flex items-center border-2 border-[#1A1A1A] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md border border-accent-ink/30 bg-muted p-3 text-left font-mono text-[12px] leading-relaxed text-foreground">
            {detail}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
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
    <html lang="en">
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


function SiteBlueprint({ pathname, children }: { pathname: string; children: ReactNode }) {
  const [toneIndex, setToneIndex] = useState(0);
  const palette = paletteFor(pathname);

  useEffect(() => {
    setToneIndex(0);
    const main = document.querySelector("main");
    if (!main) return;
    const allSections = Array.from(main.querySelectorAll<HTMLElement>("section"));
    const sections = allSections.filter((section) => !section.parentElement?.closest("section"));
    const nodes = sections.length ? sections : [main];
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let best = nodes[0];
        let bestRatio = -1;
        nodes.forEach((node) => {
          const ratio = ratios.get(node) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = node;
          }
        });
        setToneIndex(Math.max(0, nodes.indexOf(best)) % palette.length);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  const tone = palette[toneIndex] ?? palette[0];
  const darkInk = tone.ink === "#111111";
  return (
    <div
      className="site-blueprint"
      style={{
        "--site-bg": tone.hex,
        "--site-ink": tone.ink,
        "--wave-art": tone.wave === "dark" ? 'url("/blueprint-waves-dark.svg")' : 'url("/blueprint-waves.svg")',
        "--wave-opacity": tone.wave === "dark" ? "0.65" : "0.72",
        "--site-header-bg": "rgba(255, 255, 255, 0.035)",
        "--site-header-border": darkInk ? "rgba(17, 17, 17, 0.22)" : "rgba(255, 255, 255, 0.16)",
        "--site-header-ink": tone.ink,
        "--site-brand-filter": darkInk ? "brightness(0)" : "brightness(0) invert(1)",
        "--site-accent": darkInk ? "#4A3A00" : "#FFE6A3",
      } as CSSProperties}
    >
      {children}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const keepsOwnField = pathname === "/" || pathname.startsWith("/landing") || pathname.startsWith("/seminar");

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {keepsOwnField ? <Outlet /> : <SiteBlueprint pathname={pathname}><Outlet /></SiteBlueprint>}
      <Toaster />
      <ClientOnly fallback={null}><Suspense fallback={null}><CloudSync /></Suspense></ClientOnly>
    </QueryClientProvider>
  );
}
