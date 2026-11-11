import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AccountMenu({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (host.current && !host.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  };

  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={host} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-[#1A1A1A] font-mono text-[11px] font-bold text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-[220px] border-2 border-[#1A1A1A] bg-white"
        >
          <div className="border-b border-[#1A1A1A]/12 px-3 py-2">
            <p className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/45">
              Signed in
            </p>
            <p className="mt-0.5 truncate font-serif text-[13px] text-[#1A1A1A]/80">
              {email || "your account"}
            </p>
          </div>

          <div className="p-1">
            <Link
              to="/workspace"
              onClick={() => setOpen(false)}
              className="block px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/70 hover:bg-[#FDFBF7] hover:text-[#1A4BFF]"
            >
              Workspace
            </Link>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/70 hover:bg-[#FDFBF7] hover:text-[#1A4BFF]"
            >
              Thinking profile
            </Link>
            <Link
              to="/digest"
              onClick={() => setOpen(false)}
              className="block px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/70 hover:bg-[#FDFBF7] hover:text-[#1A4BFF]"
            >
              The record
            </Link>
            <Link
              to="/cases"
              onClick={() => setOpen(false)}
              className="block px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]/70 hover:bg-[#FDFBF7] hover:text-[#1A4BFF]"
            >
              Cases
            </Link>
          </div>

          <div className="border-t border-[#1A1A1A]/12 p-1">
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 px-2 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#C1121F] hover:bg-[#FDFBF7]"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
