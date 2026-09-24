/**
 * Seções prontas com os widgets de conteúdo: preços, depoimentos, cards e
 * galeria. Mesmo formato de SECTION_TEMPLATES (ids novos a cada inserção).
 */
import { containerPresets } from "../components/container.tsx";
import { h, type NodeSpec } from "../core/build.ts";
import { defaultBackground, sides } from "../core/defaults.ts";
import { responsive } from "../core/responsive.ts";
import { C } from "../core/theme.ts";
import type { SectionTemplate } from "./sections.ts";

/** Título + subtítulo centralizados no topo da seção. */
const intro = (title: string, subtitle?: string): NodeSpec[] => [
  h("Heading", {
    text: title,
    typography: {
      fontSize: responsive("40px", "34px", "28px"),
      textAlign: responsive("center"),
    },
    box: { maxWidth: responsive("760px") },
  }),
  ...(subtitle
    ? [
        h("Text", {
          html: `<p>${subtitle}</p>`,
          typography: {
            textAlign: responsive("center"),
            color: C.textMuted,
            fontSize: responsive("18px", undefined, "16px"),
          },
          box: {
            maxWidth: responsive("640px"),
            margin: responsive(sides("-16px", "0px", "0px", "0px")),
          },
        }),
      ]
    : []),
];

const section = (children: NodeSpec[], name: string, surface = false): NodeSpec =>
  h(
    "Section",
    {
      alignItems: responsive("center"),
      gap: responsive("48px", undefined, "32px"),
      padding: responsive(sides("88px", "24px"), undefined, sides("56px", "16px")),
      ...(surface ? { background: defaultBackground({ type: "color", color: C.surface }) } : {}),
    },
    children,
    name,
  );

const grid = (n: number, children: NodeSpec[], name: string, extra: Record<string, unknown> = {}) =>
  h("Container", { ...containerPresets.grid(n), ...extra }, children, name);

/* ------------------------------------------------------------------ */
/* Preços                                                              */
/* ------------------------------------------------------------------ */

/** Botão secundário (planos fora do destaque). */
const softButton = {
  background: {
    type: "color",
    color: `color-mix(in srgb, ${C.primary} 10%, transparent)`,
  },
  typography: { color: C.primary },
  shadow: { enabled: false },
  hover: {
    background: `color-mix(in srgb, ${C.primary} 18%, transparent)`,
    scale: 1,
  },
};

const feat = (id: string, text: string, included = true) => ({
  id,
  text,
  included,
});

const plan = (props: Record<string, unknown>, featured = false) =>
  h(
    "PricingTable",
    {
      ...props,
      featured,
      ...(featured ? {} : { button: softButton }),
    },
    [],
    String(props.name ?? "Plano"),
  );

const pricing3 = (): NodeSpec =>
  section(
    [
      ...intro(
        "Escolha o plano ideal para você",
        "Comece hoje e cancele quando quiser. Todos os planos têm 7 dias de garantia.",
      ),
      grid(
        3,
        [
          plan({
            name: "Essencial",
            description: "Para dar os primeiros passos.",
            amount: "47",
            features: [
              feat("a1", "Acesso ao curso completo"),
              feat("a2", "Materiais para download"),
              feat("a3", "Comunidade exclusiva", false),
              feat("a4", "Mentoria em grupo", false),
              feat("a5", "Certificado de conclusão", false),
            ],
            ctaText: "Começar agora",
            installments: "ou 12x de R$ 4,70",
          }),
          plan(
            {
              name: "Profissional",
              description: "O mais escolhido por quem quer resultado.",
              amount: "97",
              features: [
                feat("b1", "Acesso ao curso completo"),
                feat("b2", "Materiais para download"),
                feat("b3", "Comunidade exclusiva"),
                feat("b4", "Mentoria em grupo"),
                feat("b5", "Certificado de conclusão", false),
              ],
              ctaText: "Quero o Profissional",
              installments: "ou 12x de R$ 9,70",
              footerNote: "Garantia de 7 dias",
            },
            true,
          ),
          plan({
            name: "Premium",
            description: "Acompanhamento completo e suporte prioritário.",
            amount: "197",
            features: [
              feat("c1", "Acesso ao curso completo"),
              feat("c2", "Materiais para download"),
              feat("c3", "Comunidade exclusiva"),
              feat("c4", "Mentoria em grupo"),
              feat("c5", "Certificado de conclusão"),
            ],
            ctaText: "Quero o Premium",
            installments: "ou 12x de R$ 19,70",
          }),
        ],
        "Planos",
        {
          columns: responsive(3, 1, 1),
          gap: responsive("24px", "32px"),
          align: responsive("stretch"),
          box: { maxWidth: responsive("1120px", "480px") },
        },
      ),
    ],
    "Preços",
    true,
  );

const pricing2 = (): NodeSpec =>
  section(
    [
      ...intro("Mensal ou anual: você escolhe", "No plano anual você economiza e garante o preço por 12 meses."),
      grid(
        2,
        [
          plan({
            name: "Mensal",
            description: "Flexibilidade para começar sem compromisso.",
            amount: "97",
            period: "/mês",
            features: [
              feat("m1", "Acesso a todo o conteúdo"),
              feat("m2", "Atualizações incluídas"),
              feat("m3", "Suporte por e-mail"),
              feat("m4", "Bônus exclusivos", false),
            ],
            ctaText: "Assinar mensal",
          }),
          plan(
            {
              name: "Anual",
              description: "O melhor custo-benefício.",
              oldPrice: "R$ 1.164",
              amount: "797",
              period: "/ano",
              installments: "ou 12x de R$ 79,70",
              badgeText: "Economize 30%",
              features: [
                feat("y1", "Acesso a todo o conteúdo"),
                feat("y2", "Atualizações incluídas"),
                feat("y3", "Suporte prioritário"),
                feat("y4", "Bônus exclusivos"),
              ],
              ctaText: "Assinar anual",
              footerNote: "Garantia de 7 dias",
            },
            true,
          ),
        ],
        "Planos",
        {
          columns: responsive(2, undefined, 1),
          gap: responsive("24px", undefined, "32px"),
          box: { maxWidth: responsive("840px") },
        },
      ),
    ],
    "Preços",
  );

/* ------------------------------------------------------------------ */
/* Depoimentos                                                         */
/* ------------------------------------------------------------------ */

const TESTIMONIALS = [
  {
    quote:
      "Em três semanas eu já tinha recuperado o investimento. O passo a passo é direto ao ponto e o suporte responde rápido.",
    name: "Mariana Costa",
    role: "Fundadora da Ateliê Aurora",
  },
  {
    quote:
      "Já tinha tentado outros métodos, mas foi aqui que tudo fez sentido. Hoje minha agenda está cheia pelos próximos dois meses.",
    name: "Rafael Almeida",
    role: "Personal trainer",
  },
  {
    quote:
      "Conteúdo prático, sem enrolação. Apliquei as estratégias na mesma semana e as vendas da loja cresceram 40%.",
    name: "Juliana Ferreira",
    role: "E-commerce Casa Bela",
  },
];

const testimonials3 = (): NodeSpec =>
  section(
    [
      ...intro("Quem já usa, recomenda", "Resultados reais de clientes que começaram exatamente de onde você está."),
      grid(
        3,
        TESTIMONIALS.map((t) => h("Testimonial", { ...t, layout: "card" }, [], t.name)),
        "Depoimentos",
        { box: { maxWidth: responsive("1120px") } },
      ),
    ],
    "Depoimentos",
    true,
  );

const testimonialSingle = (): NodeSpec =>
  section(
    [
      h(
        "Testimonial",
        {
          layout: "centered",
          quote:
            "Esse foi o melhor investimento que fiz no meu negócio. Em seis meses dobrei o faturamento e finalmente consigo tirar férias sem me preocupar.",
          name: "Fernanda Ribeiro",
          role: "CEO da Studio Fê",
          showQuoteIcon: true,
          quoteIconSize: "44px",
          avatarSize: responsive("80px", undefined, "64px"),
          gap: responsive("20px"),
          quoteTypography: {
            fontSize: responsive("26px", "22px", "19px"),
            lineHeight: responsive("1.5"),
            fontWeight: "500",
          },
          nameTypography: { fontSize: responsive("18px") },
          background: { type: "none" },
          border: { style: "none" },
          shadow: { enabled: false },
          padding: responsive(sides("0px")),
          box: { maxWidth: responsive("820px") },
        },
        [],
        "Depoimento",
      ),
    ],
    "Depoimento",
  );

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

const CARDS = [
  {
    title: "Planejamento estratégico",
    text: "Defina metas claras e um plano de ação para os próximos 90 dias.",
    badge: "Novo",
  },
  {
    title: "Marketing que converte",
    text: "Campanhas e conteúdos pensados para atrair o cliente certo.",
    badge: "",
  },
  {
    title: "Vendas no automático",
    text: "Funis e automações que vendem enquanto você cuida do negócio.",
    badge: "",
  },
];

const cards3 = (): NodeSpec =>
  section(
    [
      ...intro("O que você vai encontrar", "Tudo o que precisa para tirar suas ideias do papel, em um só lugar."),
      grid(
        3,
        CARDS.map((c) => h("Card", c, [], c.title)),
        "Cards",
        { box: { maxWidth: responsive("1120px") } },
      ),
    ],
    "Cards",
  );

const cards2Horizontal = (): NodeSpec =>
  section(
    [
      ...intro("Conheça nossos serviços"),
      grid(
        2,
        [
          {
            title: "Consultoria individual",
            text: "Um especialista analisa seu negócio e monta um plano sob medida para você crescer com segurança.",
            badge: "Mais procurado",
          },
          {
            title: "Workshop para equipes",
            text: "Treinamento prático e dinâmico para alinhar o time e acelerar os resultados da empresa.",
            badge: "",
          },
        ].map((c) =>
          h(
            "Card",
            {
              ...c,
              imagePosition: responsive("left"),
              imageWidth: responsive("42%"),
              ctaType: "button",
              ctaText: "Quero saber mais",
              ctaIcon: "",
              gap: responsive("12px"),
              padding: responsive(sides("28px"), undefined, sides("20px")),
            },
            [],
            c.title,
          ),
        ),
        "Cards",
        {
          columns: responsive(2, 1, 1),
          box: { maxWidth: responsive("1120px", "640px") },
        },
      ),
    ],
    "Cards",
    true,
  );

/* ------------------------------------------------------------------ */
/* Galeria                                                             */
/* ------------------------------------------------------------------ */

const galleryImages = (n: number, captions = false) =>
  Array.from({ length: n }, (_, i) => ({
    id: `g${i + 1}`,
    src: "",
    alt: "",
    caption: captions ? `Projeto ${i + 1}` : "",
    link: { type: "none" },
  }));

const galleryGrid = (): NodeSpec =>
  section(
    [
      ...intro("Nosso trabalho", "Uma seleção de projetos recentes. Clique em uma imagem para ampliar."),
      h(
        "Gallery",
        {
          images: galleryImages(6),
          layout: "grid",
          columns: responsive(3, undefined, 2),
          ratio: "4/3",
          hoverEffect: "zoom",
          captions: "none",
          box: { maxWidth: responsive("1120px") },
        },
        [],
        "Galeria",
      ),
    ],
    "Galeria",
  );

const galleryMasonry = (): NodeSpec =>
  section(
    [
      ...intro("Galeria de fotos"),
      h(
        "Gallery",
        {
          images: galleryImages(8, true),
          layout: "masonry",
          columns: responsive(4, 3, 2),
          gap: responsive("16px", undefined, "10px"),
          hoverEffect: "zoom-overlay",
          captions: "overlay",
          radius: "12px",
          box: { maxWidth: responsive("1200px") },
        },
        [],
        "Galeria",
      ),
    ],
    "Galeria",
    true,
  );

/* ------------------------------------------------------------------ */
/* Números                                                             */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: 12000, prefix: "+", suffix: "", label: "clientes atendidos" },
  { value: 98, prefix: "", suffix: "%", label: "de satisfação" },
  { value: 4.9, prefix: "", suffix: "/5", label: "nota média", decimals: 1 },
  { value: 15, prefix: "", suffix: " anos", label: "de experiência" },
];

const stats4 = (): NodeSpec =>
  section(
    [
      ...intro("Resultados que falam por si"),
      grid(
        4,
        STATS.map((s) => h("StatCounter", { decimals: 0, ...s }, [], "Contador")),
        "Números",
        {
          columns: responsive(4, 2, 2),
          box: { maxWidth: responsive("1120px") },
        },
      ),
    ],
    "Números",
    true,
  );

export const CONTENT_TEMPLATES: SectionTemplate[] = [
  {
    id: "pricing-3",
    category: "Preços",
    name: "3 planos com destaque",
    kind: "section",
    build: pricing3,
  },
  {
    id: "pricing-2",
    category: "Preços",
    name: "Mensal e anual",
    kind: "section",
    build: pricing2,
  },
  {
    id: "testimonials-cards-3",
    category: "Depoimentos",
    name: "3 depoimentos em cards",
    kind: "section",
    build: testimonials3,
  },
  {
    id: "testimonial-single",
    category: "Depoimentos",
    name: "Depoimento em destaque",
    kind: "section",
    build: testimonialSingle,
  },
  {
    id: "cards-3",
    category: "Cards",
    name: "3 cards",
    kind: "section",
    build: cards3,
  },
  {
    id: "cards-2-horizontal",
    category: "Cards",
    name: "2 cards horizontais",
    kind: "section",
    build: cards2Horizontal,
  },
  {
    id: "gallery-grid",
    category: "Galeria",
    name: "Galeria em grade",
    kind: "section",
    build: galleryGrid,
  },
  {
    id: "gallery-masonry",
    category: "Galeria",
    name: "Galeria mosaico",
    kind: "section",
    build: galleryMasonry,
  },
  {
    id: "stats-4",
    category: "Números",
    name: "4 números com contagem",
    kind: "section",
    build: stats4,
  },
];
