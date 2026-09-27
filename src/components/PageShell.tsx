import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "./Navigation";
import { ShootingStars } from "./ShootingStars";

/** Sets the tab title and moves focus to the page heading, so route changes are announced. */
// eslint-disable-next-line react-refresh/only-export-components
export const usePageTitle = (title: string, heading?: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    document.title = title ? `${title} · SkillVerse` : "SkillVerse";
    heading?.current?.focus({ preventScroll: true });
  }, [title, heading]);
};

const footerLink = "rounded-sm underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground";

export const PageShell = ({ title, subtitle, children, width = "max-w-6xl" }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) => {
  const h1 = useRef<HTMLHeadingElement>(null);
  usePageTitle(title, h1);
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-nebula-gradient" />
      <div aria-hidden>
        <ShootingStars />
      </div>
      <Navigation solid />
      <main id="main" tabIndex={-1} className={`container relative mx-auto flex-1 px-4 pb-20 pt-28 outline-none ${width}`}>
        <div className="mb-10">
          <h1 ref={h1} tabIndex={-1} className="break-words text-[2rem] font-extrabold outline-none sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
      {/* pr-20 keeps the text clear of the tutor launcher; the bottom padding clears the phone tab bar */}
      <footer className={`container mx-auto px-4 pb-[calc(var(--bottom-bar-height)_+_2rem)] text-sm text-muted-foreground ${width}`}>
        <p className="border-t border-border/50 pr-20 pt-6">
          Started as a hackathon MVP<span aria-hidden> · </span>
          <a className={footerLink} href="https://github.com/aryansajiv19/SkillVerse">Source on GitHub</a>
          <span aria-hidden> · </span>
          <Link className={footerLink} to="/about">How it's built</Link>
        </p>
      </footer>
    </div>
  );
};
