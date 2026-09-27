export interface CheatSheetData {
  skillId: string;
  title: string;
  description: string;
  sections: {
    title: string;
    items: {
      syntax: string;
      description: string;
      example?: string;
    }[];
  }[];
}

export const CheatSheet = ({ data }: { data: CheatSheetData }) => (
  <section aria-labelledby={`sheet-${data.skillId}`} className="glass-panel rounded-2xl p-6 sm:p-8">
    <h2 id={`sheet-${data.skillId}`} className="text-2xl font-bold">{data.title}</h2>
    <p className="mt-1 text-muted-foreground">{data.description}</p>
    <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
      {data.sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-3 font-sans text-base font-semibold text-foreground/90">{section.title}</h3>
          <dl className="divide-y divide-border/50 rounded-xl border border-border/60 bg-background/30">
            {section.items.map((item) => (
              <div key={item.syntax} className="space-y-1 px-4 py-3">
                <dt><code className="font-mono text-sm text-[hsl(var(--secondary))]">{item.syntax}</code></dt>
                <dd className="text-sm text-muted-foreground">{item.description}</dd>
                {item.example && (
                  <dd><pre className="mt-1 overflow-x-auto rounded-md bg-background/60 p-2.5 font-mono text-xs leading-relaxed text-foreground/85">{item.example}</pre></dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  </section>
);
