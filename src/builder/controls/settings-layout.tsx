import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";

/** Default settings panel tabs: Conteúdo / Estilo / Avançado. */
export function SettingsTabs({
  content,
  style,
  advanced,
}: {
  content?: ReactNode;
  style?: ReactNode;
  advanced?: ReactNode;
}) {
  const first = content ? "content" : style ? "style" : "advanced";
  return (
    <Tabs defaultValue={first} className="gap-0">
      <TabsList className="mx-4 mt-3 mb-1 grid h-8 w-[calc(100%-2rem)] grid-cols-3">
        <TabsTrigger value="content" disabled={!content} className="text-xs">
          Conteúdo
        </TabsTrigger>
        <TabsTrigger value="style" disabled={!style} className="text-xs">
          Estilo
        </TabsTrigger>
        <TabsTrigger value="advanced" disabled={!advanced} className="text-xs">
          Avançado
        </TabsTrigger>
      </TabsList>
      {content ? <TabsContent value="content">{content}</TabsContent> : null}
      {style ? <TabsContent value="style">{style}</TabsContent> : null}
      {advanced ? <TabsContent value="advanced">{advanced}</TabsContent> : null}
    </Tabs>
  );
}
