import { Layers, LayoutTemplate, Plus, Settings2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { cn } from "#/lib/utils";
import { LayersPanel } from "./layers.tsx";
import { type PageMeta, PageMetaPanel } from "./page-settings.tsx";
import { useSectionPicker } from "./section-picker-store.ts";
import { PageStylesPanel } from "./settings-panel.tsx";
import { type LeftPanel as Panel, useEditorUI } from "./store.ts";
import { Toolbox } from "./toolbox.tsx";

const TABS: { value: Panel; label: string; icon: typeof Plus }[] = [
	{ value: "add", label: "Adicionar", icon: Plus },
	{ value: "layers", label: "Camadas", icon: Layers },
	{ value: "page", label: "Página", icon: Settings2 },
];

export function LeftPanel({
	meta,
	onMetaSaved,
}: {
	meta: PageMeta;
	onMetaSaved: (m: PageMeta) => void;
}) {
	const panel = useEditorUI((s) => s.leftPanel);
	const setPanel = useEditorUI((s) => s.setLeftPanel);
	const openPicker = useSectionPicker((s) => s.open);

	return (
		<aside className="flex w-72 shrink-0 flex-col border-r border-border bg-editor-panel">
			<div className="grid grid-cols-3 border-b border-border">
				{TABS.map(({ value, label, icon: Icon }) => (
					<button
						key={value}
						type="button"
						onClick={() => setPanel(value)}
						className={cn(
							"flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground hover:text-foreground",
							panel === value &&
								"bg-accent/50 text-foreground shadow-[inset_0_-2px_0_var(--primary)]",
						)}
					>
						<Icon className="size-4" />
						{label}
					</button>
				))}
			</div>
			<ScrollArea className="min-h-0 flex-1">
				{panel === "add" ? (
					<>
						<div className="p-4 pb-0">
							<Button className="w-full" onClick={() => openPicker()}>
								<LayoutTemplate className="size-4" /> Adicionar seção
							</Button>
						</div>
						<Toolbox />
					</>
				) : null}
				{panel === "layers" ? <LayersPanel /> : null}
				{panel === "page" ? (
					<Tabs defaultValue="styles" className="gap-0">
						<TabsList className="mx-4 mt-3 mb-1 grid h-8 w-[calc(100%-2rem)] grid-cols-2">
							<TabsTrigger value="styles" className="text-xs">
								Estilos
							</TabsTrigger>
							<TabsTrigger value="settings" className="text-xs">
								Configurações
							</TabsTrigger>
						</TabsList>
						<TabsContent value="styles">
							<PageStylesPanel />
						</TabsContent>
						<TabsContent value="settings">
							<PageMetaPanel initial={meta} onSaved={onMetaSaved} />
						</TabsContent>
					</Tabs>
				) : null}
			</ScrollArea>
		</aside>
	);
}
