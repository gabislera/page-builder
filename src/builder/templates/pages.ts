import { buildRoot, buildTree, type NodeSpec } from "../core/build.ts";
import { ROOT_ID, type SectionKind, type SectionTree } from "../core/tree.ts";
import { capturePage } from "./pages/capture.ts";
import { productPage } from "./pages/product.ts";
import { salesPage } from "./pages/sales.ts";
import { SECTION_TEMPLATES } from "./sections.ts";

type PartMode = "site" | "none";

/** Modelo de página: disponível para todos os usuários, em qualquer projeto. */
export type PageTemplate = {
  id: string;
  name: string;
  description: string;
  /** Usa o cabeçalho/rodapé do site ou fica sem (páginas de foco). */
  headerMode: PartMode;
  footerMode: PartMode;
  build: () => NodeSpec[];
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "sales",
    name: "Página de vendas",
    description: "Curso ou infoproduto: vídeo, benefícios, conteúdo, depoimentos, oferta com contagem e garantia.",
    headerMode: "none",
    footerMode: "none",
    build: salesPage,
  },
  {
    id: "capture",
    name: "Página de captura",
    description: "Aula gratuita ou e-book: promessa forte e formulário em destaque, sem distrações.",
    headerMode: "none",
    footerMode: "none",
    build: capturePage,
  },
  {
    id: "product",
    name: "Página de produto",
    description: "Loja: galeria do produto, preço, kits, avaliações e compra pelo WhatsApp.",
    headerMode: "site",
    footerMode: "site",
    build: productPage,
  },
];

const KIND: Record<string, SectionKind> = {
  Header: "header",
  Footer: "footer",
};

/** Monta a raiz e as seções de um modelo (ids novos a cada uso). */
export function buildPageTemplate(template: PageTemplate): {
  root: ReturnType<typeof buildRoot>;
  sections: SectionTree[];
} {
  return {
    root: buildRoot(),
    sections: template.build().map((spec) => {
      const tree = buildTree(spec, ROOT_ID);
      return {
        rootNodeId: tree.rootNodeId,
        kind: KIND[spec.type] ?? "section",
        name: spec.name ?? spec.type,
        isGlobal: false,
        nodes: tree.nodes,
      };
    }),
  };
}

/** Página nova: raiz + um hero centralizado. */
export function blankPage(): {
  root: ReturnType<typeof buildRoot>;
  sections: SectionTree[];
} {
  const hero = SECTION_TEMPLATES.find((t) => t.id === "hero-centered");
  if (!hero) throw new Error("Modelo hero-centered ausente");
  const tree = buildTree(hero.build(), ROOT_ID);
  return {
    root: buildRoot(),
    sections: [
      {
        rootNodeId: tree.rootNodeId,
        kind: "section",
        name: "Hero",
        isGlobal: false,
        nodes: tree.nodes,
      },
    ],
  };
}
