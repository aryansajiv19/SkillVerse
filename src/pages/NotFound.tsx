import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <PageShell title="Lost in space" subtitle="There's no star at this address.">
    <Button asChild size="lg"><Link to="/">Back to the galaxy</Link></Button>
  </PageShell>
);

export default NotFound;
