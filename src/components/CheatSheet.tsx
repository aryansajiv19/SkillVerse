import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

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

interface CheatSheetProps {
  data: CheatSheetData;
}

export const CheatSheet = ({ data }: CheatSheetProps) => {
  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <CardTitle className="cosmic-glow">{data.title}</CardTitle>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {data.sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-secondary">{section.title}</h3>
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <code className="text-accent font-mono text-sm">{item.syntax}</code>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    {item.example && (
                      <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-x-auto">
                        <code className="text-foreground/80">{item.example}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
