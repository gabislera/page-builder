/**
 * AI-Spec: the compact language the model writes to describe a section.
 *
 * The model picks building blocks, copy, and design tokens; `compile.ts`
 * turns that into real builder nodes using the same helpers as the
 * hand-made templates. That keeps every generated section on-theme,
 * responsive, and editable.
 *
 * The schema follows OpenAI strict Structured Outputs: every field is
 * required (optional values are `nullable`) and there is no recursion
 * (Section → group → leaf, three levels at most). Unions are plain
 * `z.union` because strict mode accepts `anyOf` but not `oneOf`.
 */
import { z } from "zod";

const text = (hint: string) => z.string().describe(hint);
const icon = z.string().describe('Nome de ícone lucide em kebab-case, ex.: "rocket", "shield-check", "heart"');

export const ActionSpec = z
  .object({
    type: z.enum(["none", "url", "section", "whatsapp"]),
    /** url: address; section: anchor of another section; whatsapp: digits with country code. */
    value: z.string().nullable(),
  })
  .describe(
    'Clique. "section" rola até a âncora de outra seção (value = âncora). "whatsapp": value = telefone com DDI.',
  );

/* ------------------------------------------------------------------ */
/* Leaves                                                              */
/* ------------------------------------------------------------------ */

const Eyebrow = z.object({ type: z.literal("Eyebrow"), text: text("Texto curto em caixa alta acima do título") });

const Title = z.object({
  type: z.literal("Title"),
  text: text("Título. Pode usar \\n para quebrar linha"),
  level: z.enum(["h1", "h2", "h3"]).describe("h1 só no hero principal da página"),
  size: z.enum(["display", "xl", "lg", "md"]).describe("display: hero; xl: título de seção; lg/md: menores"),
});

const Lead = z.object({ type: z.literal("Lead"), text: text("Subtítulo de 1 a 3 frases") });

const Paragraph = z.object({
  type: z.literal("Paragraph"),
  html: text("HTML simples: <p>, <strong>, <em>, <ul><li>. Sem estilos inline"),
});

const Pill = z.object({ type: z.literal("Pill"), text: text('Selo curto, ex.: "Turma 2026 · Vagas abertas"') });

const Button = z.object({
  type: z.literal("Button"),
  text: text("Texto do botão, começando com verbo"),
  variant: z.enum(["primary", "secondary"]),
  icon: icon.nullable(),
  action: ActionSpec,
});

const Checklist = z.object({
  type: z.literal("Checklist"),
  items: z.array(z.string()).describe("3 a 8 itens curtos"),
  icon: icon.nullable(),
  layout: z.enum(["vertical", "horizontal"]),
});

const Image = z.object({
  type: z.literal("Image"),
  description: text("O que a foto mostra (vira o texto alternativo e guia a escolha da imagem)"),
  ratio: z.enum(["16/9", "4/3", "1/1", "3/4"]),
});

const Video = z.object({
  type: z.literal("Video"),
  url: z.string().nullable().describe("URL do YouTube/Vimeo se o usuário informou, senão null"),
});

const Features = z.object({
  type: z.literal("Features"),
  style: z
    .enum(["cards", "plain", "inline"])
    .describe("cards: caixas com borda; plain: sem caixa; inline: ícone ao lado"),
  columns: z.number().describe("2, 3 ou 4"),
  items: z.array(z.object({ icon, title: z.string(), text: z.string() })),
});

const Steps = z.object({
  type: z.literal("Steps"),
  items: z.array(z.object({ title: z.string(), text: z.string() })).describe("Passo a passo numerado, 3 a 4 itens"),
});

const Testimonials = z
  .object({
    type: z.literal("Testimonials"),
    layout: z.enum(["grid", "single"]).describe("single: um depoimento grande e centralizado"),
    photos: z
      .boolean()
      .describe("Foto da pessoa em destaque. O bloco já tem o espaço da foto, que o usuário envia depois"),
    items: z.array(
      z.object({
        quote: z.string(),
        name: z.string(),
        role: z.string(),
        rating: z.number().describe("0 a 5 (0 esconde as estrelas)"),
      }),
    ),
  })
  .describe("SEMPRE use este bloco para depoimentos e avaliações, inclusive quando pedirem foto ou estrelas");

const Pricing = z.object({
  type: z.literal("Pricing"),
  plans: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      price: z.string().describe('Só a parte inteira, ex.: "97"'),
      cents: z.string().describe('Ex.: "90", ou "" sem centavos'),
      period: z.string().describe('Ex.: "/mês", ou ""'),
      oldPrice: z.string().describe('Preço antigo riscado, ex.: "R$ 297", ou ""'),
      installments: z.string().describe('Ex.: "ou 12x de R$ 9,70", ou ""'),
      features: z.array(z.object({ text: z.string(), included: z.boolean() })),
      cta: z.string(),
      featured: z.boolean(),
      badge: z.string().describe('Selo do plano em destaque, ex.: "Mais escolhido", ou ""'),
      note: z.string().describe('Nota abaixo do botão, ex.: "Garantia de 7 dias", ou ""'),
    }),
  ),
});

const Faq = z.object({
  type: z.literal("Faq"),
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
});

const Stats = z.object({
  type: z.literal("Stats"),
  items: z.array(
    z.object({
      value: z.number(),
      decimals: z.number(),
      prefix: z.string(),
      suffix: z.string(),
      label: z.string(),
    }),
  ),
});

const CaptureForm = z.object({
  type: z.literal("CaptureForm"),
  fields: z.array(z.enum(["name", "email", "phone", "company", "message"])),
  submitText: z.string(),
  successMessage: z.string(),
});

const Countdown = z.object({
  type: z.literal("Countdown"),
  minutes: z.number().describe("Contagem por visitante (evergreen), em minutos"),
});

export const LeafSpec = z.union([
  Eyebrow,
  Title,
  Lead,
  Paragraph,
  Pill,
  Button,
  Checklist,
  Image,
  Video,
  Features,
  Steps,
  Testimonials,
  Pricing,
  Faq,
  Stats,
  CaptureForm,
  Countdown,
]);

/* ------------------------------------------------------------------ */
/* Groups                                                              */
/* ------------------------------------------------------------------ */

const Stack = z.object({
  type: z.literal("Stack"),
  align: z.enum(["left", "center"]),
  boxed: z.boolean().describe("Caixa branca com borda e sombra (ex.: formulário, oferta)"),
  children: z.array(LeafSpec),
});

const Split = z.object({
  type: z.literal("Split"),
  mediaSide: z.enum(["left", "right"]),
  ratio: z.enum(["equal", "text-wide", "media-wide"]),
  content: z.array(LeafSpec).describe("Coluna de texto"),
  media: z.array(LeafSpec).describe("Coluna de mídia: Image, Video, CaptureForm, Stack de Checklist..."),
});

const Grid = z.object({
  type: z.literal("Grid"),
  columns: z.number().describe("2, 3 ou 4"),
  boxed: z.boolean(),
  cells: z.array(z.object({ children: z.array(LeafSpec) })),
});

export const BlockSpec = z.union([...LeafSpec.options, Stack, Split, Grid]);

export const SectionSpec = z.object({
  name: z.string().describe('Nome curto da seção no editor, ex.: "Hero", "Benefícios"'),
  anchor: z.string().nullable().describe('Âncora para links internos, ex.: "oferta". null se ninguém aponta pra ela'),
  tone: z
    .enum(["light", "surface", "dark", "brand", "tint"])
    .describe(
      "Fundo: light (branco), surface (cinza claro), dark (escuro), brand (cor primária), tint (primária bem suave)",
    ),
  align: z.enum(["center", "left"]),
  spacing: z.enum(["compact", "normal", "spacious"]),
  children: z.array(BlockSpec),
});

export type ActionSpec = z.infer<typeof ActionSpec>;
export type LeafSpec = z.infer<typeof LeafSpec>;
export type BlockSpec = z.infer<typeof BlockSpec>;
export type SectionSpec = z.infer<typeof SectionSpec>;
