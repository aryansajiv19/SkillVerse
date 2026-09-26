import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { ShootingStars } from "./ShootingStars";

export const PageShell = ({ title, subtitle, children, width = "max-w-6xl" }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) => (
  <div className="relative min-h-screen">
    <div className="fixed inset-0 -z-10 bg-nebula-gradient" />
    <ShootingStars />
    <Navigation />
    <main className={`container relative mx-auto px-4 pb-24 pt-28 ${width}`}>
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </main>
  </div>
);
