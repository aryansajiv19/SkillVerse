import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navigation } from "./Navigation";
import { ShootingStars } from "./ShootingStars";

/** Sets the tab title and, on navigation only, moves focus to the page heading so route changes are announced. */
// eslint-disable-next-line react-refresh/only-export-components
export const usePageTitle = (title: string, heading?: React.RefObject<HTMLElement | null>) => {
  const { key } = useLocation();
  useEffect(() => {
    document.title = title ? `${title} · SkillVerse` : "SkillVerse";
  }, [title]);
  useEffect(() => {
    heading?.current?.focus({ preventScroll: true });
  }, [key, heading]);
};

const footerLink = "rounded-sm underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground";

export const PageShell = ({ title, documentTitle = title, nameTitle = false, subtitle, children, width = "max-w-6xl" }: {
  title: string;
  /** The title is a username (up to 20 characters): size it down so it fits on one line. */
  nameTitle?: boolean;
  /** Tab title, when the visible heading doesn't name the page (the dashboard shows the username). */
  documentTitle?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) => {
  const h1 = useRef<HTMLHeadingElement>(null);
  usePageTitle(documentTitle, h1);
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-nebula-gradient" />
      {/* Its own layer behind the content, so meteors never cross text */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <ShootingStars />
      </div>
      <Navigation solid />
      <main id="main" tabIndex={-1} className={`container relative mx-auto flex-1 px-4 pb-20 pt-28 sm:px-8 outline-none ${width}`}>
        <div className="mb-10">
          <h1 ref={h1} tabIndex={-1} className={`break-words font-extrabold outline-none ${nameTitle ? "text-[clamp(1.25rem,5.5vw,3rem)]" : "text-[clamp(1.5rem,8vw,3rem)]"}`}>{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
      {/* pr-20 keeps the text clear of the tutor launcher; the bottom padding clears the phone tab bar */}
      <footer className={`container mx-auto px-4 sm:px-8 pb-[calc(var(--bottom-bar-height)_+_2rem)] text-sm text-muted-foreground ${width}`}>
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
