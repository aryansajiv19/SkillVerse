import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

const words = (s: string) => s.toLowerCase().split(/[\s.&/()-]+/);

/**
 * Replaces cmdk's fuzzy score, which matches letters scattered across keywords ("rea" found
 * Dashboard through "stREAk"). Ranks the item's name, then word starts, then keywords;
 * a mid-word match only counts inside the name (and past one letter), so "sql" still finds PostgreSQL.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const rankMatch = (value: string, search: string, keywords: string[] = []) => {
  const q = search.trim().toLowerCase();
  const name = value.toLowerCase();
  if (name.startsWith(q)) return 1;
  if (words(name).some((w) => w.startsWith(q))) return 0.9;
  if (keywords.some((k) => words(k).some((w) => w.startsWith(q)) || k.toLowerCase().startsWith(q))) return 0.7;
  return q.length > 1 && name.includes(q) ? 0.5 : 0;
};

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, filter = rankMatch, ...props }, ref) => (
  <CommandPrimitive ref={ref} filter={filter} className={cn("flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground", className)} {...props} />
));
Command.displayName = CommandPrimitive.displayName;

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b px-4">
    <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    <CommandPrimitive.Input
      ref={ref}
      className={cn("h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn("max-h-[min(50vh,26rem)] overflow-y-auto overflow-x-hidden overscroll-contain", className)} {...props} />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} className="px-4 py-10 text-center text-sm text-muted-foreground" {...props} />);
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "p-1.5 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-foreground/10 data-[disabled=true]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList };
