import type * as React from "react";

import { cn } from "@/lib/utils";

const Kbd = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <kbd
    className={cn(
      "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium leading-none text-muted-foreground",
      className,
    )}
    {...props}
  />
);

export { Kbd };
