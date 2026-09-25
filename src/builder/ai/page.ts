/**
 * Whole-page generation. Two stages:
 * 1. plan: a stronger model turns the brief into an outline (behind the
 *    scenes: the user only sees its sections appear);
 * 2. sections: each outline item is generated in parallel with the
 *    section prompt, seeing the brief and the whole outline for consistency.
 */
import { z } from "zod";
import { DEFAULT_IDENTITY } from "../core/theme.ts";

export const PAGE_TYPES = [
  {
    id: "sales",
    label: "Vendas",
    description: "Curso, infoproduto ou oferta com checkout",
    headerMode: "none",
    footerMode: "none",
    recipe: `Hero escuro com promessa, vídeo ou imagem e botão para a oferta; prova rápida (Stats) se fizer sentido; para quem é (Checklist ou Features); benefícios (Features); como funciona ou conteúdo (Steps); quem está por trás (Split com Image); depoimentos; oferta com âncora "oferta" (Pricing ou Stack boxed com Checklist do que está incluso, preço e botão; Countdown opcional); garantia; FAQ; chamada final escura.`,
  },
  {
    id: "capture",
    label: "Captura",
    description: "Aula gratuita, e-book ou lista de espera",
    headerMode: "none",
    footerMode: "none",
    recipe: `Hero em Split com o formulário (CaptureForm) ao lado da promessa, âncora "formulario"; o que a pessoa vai receber ou aprender (Features ou Checklist); para quem é; quem ensina (Split com Image); depoimentos curtos (opcional); chamada final com botão para o formulário. Página curta: 4 a 6 seções.`,
  },
  {
    id: "service",
    label: "Serviço",
    description: "Negócio local, consultoria ou produto",
    headerMode: "site",
    footerMode: "site",
    recipe: `Hero em Split com imagem e botão de contato; serviços ou produtos (Features em cards); diferenciais ou números (Stats); como funciona (Steps); depoimentos; preços se houver (Pricing); FAQ; chamada final de contato.`,
  },
  {
    id: "institutional",
    label: "Institucional",
    description: "Sobre a empresa, marca ou profissional",
    headerMode: "site",
    footerMode: "site",
    recipe: `Hero com a proposta da marca; sobre (Split com Image); o que fazemos (Features); números (Stats); depoimentos de clientes; contato com formulário (CaptureForm com mensagem), âncora "contato".`,
  },
  {
    id: "event",
    label: "Evento",
    description: "Webinar, workshop ou evento presencial",
    headerMode: "none",
    footerMode: "none",
    recipe: `Hero com Pill da data, promessa, Countdown e botão de inscrição; o que você vai aprender (Features ou Checklist); quem apresenta (Split com Image); programação (Steps); depoimentos de edições anteriores (opcional); inscrição com CaptureForm e âncora "inscricao"; FAQ.`,
  },
] as const;

export type PageTypeId = (typeof PAGE_TYPES)[number]["id"];

export const VOICES = [
  "Próximo e amigável",
  "Profissional e confiável",
  "Direto e objetivo",
  "Sofisticado",
  "Descontraído",
] as const;

export const BriefSpec = z.object({
  pageType: z.enum(PAGE_TYPES.map((t) => t.id) as [PageTypeId, ...PageTypeId[]]),
  business: z.string().trim().min(20, "Conte um pouco mais sobre o negócio e a oferta").max(3000),
  audience: z.string().trim().max(500),
  offer: z.string().trim().max(1000),
  cta: z.object({
    type: z.enum(["whatsapp", "form", "link"]),
    /** WhatsApp number or checkout link. */
    value: z.string().trim().max(500),
  }),
  voice: z.enum(VOICES),
});
export type Brief = z.infer<typeof BriefSpec>;

const TONE = z.enum(["light", "surface", "dark", "brand", "tint"]);

export const PagePlanSpec = z.object({
  pageName: z.string().describe('Nome curto da página no painel, ex.: "Curso de Confeitaria"'),
  sections: z.array(
    z.object({
      name: z
        .string()
        .describe('Nome curto da seção no editor, só a primeira letra maiúscula, ex.: "Hero", "Para quem é"'),
      anchor: z.string().nullable().describe("Âncora se algum botão aponta para esta seção, senão null"),
      tone: TONE,
      purpose: z
        .string()
        .describe(
          "Briefing da seção para o redator: o que mostrar, quais blocos usar, a mensagem principal e para onde os botões levam",
        ),
    }),
  ),
});
export type PagePlan = z.infer<typeof PagePlanSpec>;
export type PlanSection = PagePlan["sections"][number];

const pageType = (id: PageTypeId) => PAGE_TYPES.find((t) => t.id === id) ?? PAGE_TYPES[0];

function ctaText(brief: Brief): string {
  switch (brief.cta.type) {
    case "whatsapp":
      return `Conversa no WhatsApp${brief.cta.value ? ` (${brief.cta.value})` : ""}. Botões principais: action whatsapp com esse número.`;
    case "link":
      return `Link de compra/checkout${brief.cta.value ? ` (${brief.cta.value})` : ""}. Na oferta, o botão usa action url com esse link.`;
    default:
      return "Preencher um formulário da própria página. Botões principais levam até a seção do formulário.";
  }
}

export function briefText(brief: Brief, siteName: string): string {
  return `Tipo de página: ${pageType(brief.pageType).label} (${pageType(brief.pageType).description})
Marca: ${siteName && siteName !== DEFAULT_IDENTITY.name ? siteName : "não informada (use o nome do negócio, se houver)"}
Negócio e oferta: ${brief.business}
Público: ${brief.audience || "não informado (deduza do negócio)"}
Detalhes da oferta (preço, bônus, garantia): ${brief.offer || "não informado (use exemplos realistas e fáceis de editar)"}
Ação principal: ${ctaText(brief)}
Tom de voz: ${brief.voice}`;
}

export const PAGE_PLAN_INSTRUCTIONS = `Você é um estrategista de landing pages de alta conversão no Brasil.
A partir do briefing, monte o ROTEIRO da página: a sequência de seções e o que cada uma precisa fazer. Um redator vai escrever cada seção depois, em paralelo, lendo o seu roteiro. Por isso cada "purpose" precisa ser autossuficiente.

## Regras
- 4 a 10 seções. Siga a receita do tipo de página como ponto de partida e adapte ao negócio: tire o que não faz sentido e acrescente o que o caso pede.
- Não inclua cabeçalho nem rodapé; o sistema cuida disso.
- purpose: 2 a 4 frases com o conteúdo da seção, os blocos sugeridos (Features, Steps, Testimonials, Pricing, Faq, Stats, CaptureForm, Countdown, Split, Grid, Checklist, Image, Video) e a mensagem principal, com fatos do briefing (preço, prazo, bônus, público). Diga para onde os botões levam ("botão leva à âncora oferta", "botão abre o WhatsApp").
- Não escreva a copy final no purpose; descreva o que dizer.
- O redator sempre escreve texto final e plausível (depoimentos, números, nomes). Nunca peça placeholder, espaço reservado ou aviso para o dono do site.
- Âncoras: só nas seções que são destino de botão ("oferta", "formulario", "inscricao", "contato"). Todo botão que leva a uma seção precisa de uma âncora que exista.
- Fundos (tone): alterne para criar ritmo. Nunca dois dark/brand seguidos. Hero e chamada final ficam bem em dark ou brand; o resto em light, surface ou tint. Pricing e FAQ em light, surface ou tint.
- Se a ação principal é formulário, uma seção precisa ter CaptureForm.
- Dê personalidade ao ritmo: negócios leves e divertidos pedem mais seções brand e tint e composições variadas (Split alternando lados, Grid); negócios sérios pedem mais light, surface e dark. Evite a mesma composição em seções seguidas.
- pageName: 2 a 5 palavras, sem o tipo de página.`;

export function planUserPrompt(brief: Brief, siteName: string): string {
  return `${briefText(brief, siteName)}

Receita do tipo de página: ${pageType(brief.pageType).recipe}`;
}

/** User prompt for one section of the plan. */
export function pageSectionUserPrompt(
  brief: Brief,
  siteName: string,
  plan: PagePlan,
  index: number,
  /** Chosen visual direction ("Padaria de bairro: quente e acolhedora"). */
  style?: string,
): string {
  const s = plan.sections[index];
  const outline = plan.sections
    .map((x, i) => `${i + 1}. ${x.name}${x.anchor ? ` (âncora "${x.anchor}")` : ""}: ${x.purpose}`)
    .join("\n");
  return `${briefText(brief, siteName)}${style ? `\nIdentidade visual escolhida: ${style}. A copy acompanha essa personalidade.` : ""}

Roteiro completo da página "${plan.pageName}" (para manter o tom e a oferta consistentes, sem repetir o que as outras seções já dizem):
${outline}

Crie agora a seção ${index + 1}: ${s.name}.
O que ela precisa fazer: ${s.purpose}
Fundo obrigatório (tone): ${s.tone}. Âncora: ${s.anchor ?? "null"}.
${index === 0 ? 'Esta é a primeira seção: o título principal usa level "h1" e size "display".' : 'Use Title level "h2" (nunca h1).'}`;
}

export const pageTypeOf = pageType;
