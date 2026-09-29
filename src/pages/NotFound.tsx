import { Link, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { openCommandPalette } from "@/components/Navigation";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { pathname } = useLocation();
  return (
    <PageShell
      title="Lost in space"
      subtitle={
        <>
          There's no star at <code className="break-all rounded bg-muted px-1.5 py-0.5 text-base text-foreground">{pathname}</code>.
          It may have moved, or the link has a typo.
        </>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg"><Link to="/">Back to the galaxy</Link></Button>
        <Button size="lg" variant="outline" onClick={openCommandPalette}><Search aria-hidden />Search skills and pages</Button>
      </div>
    </PageShell>
  );
};

export default NotFound;
