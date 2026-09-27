import { useEffect, useRef, type ReactNode } from "react";
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

export const PageShell = ({ title, subtitle, children, width = "max-w-6xl" }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) => {
  const h1 = useRef<HTMLHeadingElement>(null);
  usePageTitle(title, h1);
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 -z-10 bg-nebula-gradient" />
      <ShootingStars />
      <Navigation />
      <main className={`container relative mx-auto px-4 pb-28 pt-28 ${width}`}>
        <div className="mb-10">
          <h1 ref={h1} tabIndex={-1} className="break-words text-4xl font-extrabold outline-none sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};
