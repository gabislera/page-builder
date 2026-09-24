/**
 * Modelo "Página de produto" (e-commerce): um produto em destaque, com
 * galeria, preço e compra na primeira dobra, depois diferenciais, ambiente,
 * detalhes em abas, kits, avaliações e dúvidas. Usa o cabeçalho e o rodapé
 * do site.
 */
import { h, type NodeSpec } from "../../core/build.ts";
import { corners, defaultShadow, sides } from "../../core/defaults.ts";
import { C } from "../../core/theme.ts";
import {
  anchor,
  bg,
  checks,
  cta,
  faq,
  grid,
  heading,
  lead,
  photo,
  picture,
  pill,
  r,
  row,
  section,
  stack,
  tint,
  title,
  white,
} from "./shared.ts";

const KITS = "kits";
const WHATSAPP = "5511999999999";
const GREEN = "#16a34a";

const IMAGES: [string, string][] = [
  ["1618366712010-f4ae9c647dcb", "Fone Aura ANC preto sobre fundo bege"],
  ["1546435770-a3e426bf472b", "Fone Aura ANC de lado"],
  ["1599669454699-248893623440", "Fone Aura ANC em fundo escuro"],
  ["1558756520-22cfe5d382ca", "Fone Aura ANC com o estojo de viagem"],
];

/* 0. Barra de aviso */
const bar = (): NodeSpec =>
  h(
    "AnnouncementBar",
    {
      text: "Frete grátis para todo o Brasil e 12x sem juros",
      icon: "truck",
      linkText: "",
      dismissible: false,
    },
    [],
    "Barra de aviso",
  );

/* 1. Produto: galeria + compra */
const gallery = () =>
  h(
    "Carousel",
    {
      slidesPerView: r(1),
      gap: r("0px"),
      showArrows: r(true, undefined, false),
      arrowShape: "circle",
      arrowBackground: "#ffffff",
      arrowColor: C.text,
      showDots: r(true),
      dotActiveColor: C.text,
      autoplay: 0,
      loop: true,
      box: { width: r("100%") },
    },
    IMAGES.map(([id, alt]) =>
      h(
        "CarouselSlide",
        {
          padding: r(sides("0px")),
          minHeight: r("0px"),
          background: bg(C.surface),
          border: { radius: r(corners("24px")) },
        },
        [
          h(
            "Image",
            {
              src: r(photo(id, 1200, 1)),
              alt,
              height: r("600px", "520px", "380px"),
            },
            [],
            "Foto",
          ),
        ],
        "Foto",
      ),
    ),
    "Galeria do produto",
  );

const priceBlock = () =>
  stack(
    [
      h(
        "Text",
        {
          html: "<p><s>R$ 1.299,00</s></p>",
          typography: { fontSize: r("16px"), color: C.textMuted },
        },
        [],
        "Preço antigo",
      ),
      row(
        [
          title("R$ 899,00", {
            tag: "p",
            align: "left",
            size: r("44px", undefined, "36px"),
            maxWidth: "100%",
          }),
          pill("-31%", {
            color: GREEN,
            background: tint(GREEN, 12),
            align: "center",
          }),
        ],
        { gap: r("12px"), wrap: r(false) },
        "Preço",
      ),
      h(
        "Text",
        {
          html: "<p>ou 12x de R$ 74,92 sem juros · <strong>R$ 809,10 no Pix</strong></p>",
          typography: { fontSize: r("16px"), color: C.textMuted },
        },
        [],
        "Parcelamento",
      ),
    ],
    { gap: r("4px") },
    "Preço",
  );

const buyBox = () =>
  stack(
    [
      pill("Mais vendido da loja", { align: "flex-start" }),
      title("Fone Aura ANC com cancelamento de ruído", {
        tag: "h1",
        align: "left",
        size: r("42px", "36px", "30px"),
        maxWidth: "560px",
      }),
      row(
        [
          h(
            "Text",
            {
              html: "<p>★★★★★</p>",
              typography: {
                fontSize: r("17px"),
                letterSpacing: r("2px"),
                color: "#f59e0b",
              },
            },
            [],
            "Estrelas",
          ),
          h(
            "Text",
            {
              html: "<p><strong>4,9</strong> · 2.318 avaliações</p>",
              typography: { fontSize: r("15px"), color: C.textMuted },
            },
            [],
            "Nota",
          ),
        ],
        { gap: r("10px") },
        "Avaliação",
      ),
      priceBlock(),
      lead(
        "Silêncio absoluto quando você precisa, som de estúdio quando você quer. Até 40 horas de bateria, conforto para o dia inteiro e conexão com dois aparelhos ao mesmo tempo.",
        { align: "left", size: r("17px", undefined, "16px"), maxWidth: "100%" },
      ),
      stack(
        [
          cta("Comprar agora", {
            action: anchor(KITS),
            align: "stretch",
            icon: "shopping-bag",
            fullWidth: r(true),
          }),
          h(
            "Button",
            {
              text: "Comprar pelo WhatsApp",
              icon: "whatsapp",
              iconPosition: "left",
              action: {
                type: "whatsapp",
                phone: WHATSAPP,
                message: "Olá! Quero comprar o Fone Aura ANC.",
              },
              fullWidth: r(true),
              padding: r(sides("18px", "24px")),
              typography: {
                fontSize: r("17px"),
                fontWeight: "700",
                color: GREEN,
              },
              background: bg("transparent"),
              border: {
                style: "solid",
                width: r(sides("2px")),
                color: GREEN,
                radius: r(corners("14px")),
              },
              shadow: defaultShadow(),
              hover: { enabled: true, background: tint(GREEN, 8), scale: 1 },
              box: { alignSelf: r("stretch") },
            },
            [],
            "WhatsApp",
          ),
        ],
        { gap: r("12px"), box: { margin: r(sides("8px", "0px", "0px")) } },
        "Botões",
      ),
      grid(
        r(2, 2, 1),
        [
          checks(["Frete grátis e rápido", "30 dias para trocar"], {
            icon: "truck",
            size: r("15px"),
            color: C.textMuted,
          }),
          checks(["Garantia de 1 ano", "Pagamento seguro"], {
            icon: "shield-check",
            size: r("15px"),
            color: C.textMuted,
          }),
        ],
        {
          gap: r("12px"),
          background: bg(C.surface),
          border: { radius: r(corners("16px")) },
          box: {
            padding: r(sides("18px", "20px")),
            margin: r(sides("8px", "0px", "0px")),
          },
        },
        "Vantagens",
      ),
    ],
    { gap: r("18px") },
    "Compra",
  );

const productHero = (): NodeSpec =>
  section(
    "Produto",
    [
      grid(
        r(2, 1, 1),
        [gallery(), buyBox()],
        {
          columnsTemplate: r("7fr 5fr"),
          gap: r("56px", "40px", "32px"),
          align: r("flex-start"),
          box: { maxWidth: r("1200px"), width: r("100%") },
        },
        "Colunas",
      ),
    ],
    {
      padding: r(sides("48px", "24px", "96px"), undefined, sides("24px", "16px", "56px")),
    },
  );

/* 2. Diferenciais */
const feature = (icon: string, t: string, d: string) =>
  h(
    "IconBox",
    {
      icon: {
        name: icon,
        size: r("26px"),
        padding: r("14px"),
        shape: "circle",
      },
      align: r("center"),
      title: t,
      description: d,
      padding: r(sides("12px")),
      hoverLift: "0px",
    },
    [],
    t,
  );

const features = (): NodeSpec =>
  section(
    "Diferenciais",
    [
      grid(
        r(4, 2, 1),
        [
          feature("volume-x", "Cancelamento de ruído", "Reduz até 98% do barulho à sua volta, do escritório ao avião."),
          feature(
            "battery-charging",
            "40 horas de bateria",
            "Uma semana de uso com uma carga. 10 minutos na tomada rendem 5 horas.",
          ),
          feature("bluetooth", "Conexão multiponto", "Fique conectado ao celular e ao notebook ao mesmo tempo."),
          feature("feather", "Leve e confortável", "Apenas 250 g e almofadas macias para usar o dia inteiro."),
        ],
        { gap: r("32px"), box: { maxWidth: r("1200px"), width: r("100%") } },
        "Diferenciais",
      ),
    ],
    {
      background: bg(C.surface),
      padding: r(sides("80px", "24px"), undefined, sides("56px", "16px")),
    },
  );

/* 3. Ambiente (imagem de fundo) */
const mood = (): NodeSpec =>
  section(
    "Ambiente",
    [
      title("Som de estúdio. Silêncio quando você quiser.", {
        color: "#ffffff",
        size: r("56px", "44px", "32px"),
        maxWidth: "820px",
      }),
      lead("Drivers de 40 mm afinados por engenheiros de áudio, graves profundos e voz cristalina em chamadas.", {
        color: white(80),
      }),
    ],
    {
      minHeight: r("560px", "480px", "420px"),
      verticalAlign: r("center"),
      gap: r("20px"),
      background: {
        type: "image",
        color: C.secondary,
        image: {
          url: photo("1470225620780-dba8ba36b745", 2000),
          size: "cover",
          position: "center center",
          repeat: false,
          fixed: false,
        },
        overlay: "#0f172ab3",
      },
    },
  );

/* 4. Detalhes em abas */
const specs = (): NodeSpec =>
  h(
    "IconList",
    {
      items: [
        ["Cancelamento de ruído", "Ativo (ANC) + modo ambiente"],
        ["Bateria", "Até 40 h (30 h com ANC)"],
        ["Recarga", "USB-C, carga rápida"],
        ["Conexão", "Bluetooth 5.3, multiponto"],
        ["Peso", "250 g"],
        ["Cores", "Preto, areia e grafite"],
      ].map(([k, v], i) => ({
        id: `s${i}`,
        icon: "check",
        text: `${k}: ${v}`,
        action: { type: "none" },
      })),
      iconColor: C.primary,
      divider: true,
      dividerColor: C.border,
      gap: r("12px"),
      typography: { fontSize: r("16px"), color: C.text },
    },
    [],
    "Especificações",
  );

const details = (): NodeSpec =>
  section("Detalhes", [
    grid(
      r(2, 1, 1),
      [
        picture(photo("1546435770-a3e426bf472b", 1000, 1), "Detalhe do fone", {
          height: r("520px", "440px", "320px"),
        }),
        stack(
          [
            ...heading("Detalhes", "Feito para acompanhar a sua rotina", undefined, {
              align: "left",
            }),
            h(
              "Tabs",
              {
                justify: "flex-start",
                panelPadding: r(sides("20px", "0px", "0px")),
                box: { width: r("100%") },
              },
              [
                h("TabItem", { label: "Descrição" }, [
                  h("Text", {
                    html: "<p>O Aura ANC foi pensado para quem trabalha, estuda e viaja com fone o dia inteiro. O cancelamento de ruído se ajusta sozinho ao ambiente e o modo ambiente deixa você ouvir o que importa sem tirar o fone.</p><p>Dobrável, vem com estojo rígido e cabe na mochila.</p>",
                  }),
                ]),
                h("TabItem", { label: "Especificações" }, [specs()]),
                h("TabItem", { label: "Na caixa" }, [
                  checks(
                    ["Fone Aura ANC", "Estojo rígido de viagem", "Cabo USB-C", "Cabo de áudio P2", "Guia rápido"],
                    { icon: "package", size: r("16px") },
                  ),
                ]),
              ],
              "Abas",
            ),
          ],
          { gap: r("22px") },
        ),
      ],
      {
        gap: r("64px", "40px", "32px"),
        align: r("center"),
        box: { maxWidth: r("1160px"), width: r("100%") },
      },
      "Colunas",
    ),
  ]);

/* 5. Kits */
const kit = (
  name: string,
  description: string,
  oldPrice: string,
  amount: string,
  installments: string,
  features: string[],
  featured = false,
) =>
  h(
    "PricingTable",
    {
      name,
      description,
      oldPrice,
      currency: "R$",
      amount,
      cents: "",
      period: "",
      installments,
      features: features.map((text, i) => ({
        id: `f${i}`,
        text,
        included: true,
      })),
      ctaText: "Comprar este kit",
      ctaIcon: "shopping-bag",
      footerNote: "Frete grátis · Envio em 24h",
      footerIcon: "truck",
      featured,
      badgeText: featured ? "Mais vendido" : "",
    },
    [],
    name,
  );

const kits = (): NodeSpec =>
  section(
    "Kits",
    [
      ...heading(
        "Escolha seu kit",
        "Quanto mais, maior o desconto",
        "Presenteie alguém ou garanta o seu e o da família com preço especial.",
      ),
      grid(
        r(3, 1, 1),
        [
          kit("1 unidade", "Para você", "R$ 1.299", "899", "ou 12x de R$ 74,92", [
            "Fone Aura ANC",
            "Estojo de viagem",
            "Garantia de 1 ano",
          ]),
          kit(
            "Kit 2 unidades",
            "Economize R$ 199",
            "R$ 2.598",
            "1.599",
            "ou 12x de R$ 133,25",
            ["2 fones Aura ANC", "2 estojos de viagem", "Garantia de 1 ano", "Brinde: capa de silicone"],
            true,
          ),
          kit("Kit 3 unidades", "Economize R$ 448", "R$ 3.897", "2.249", "ou 12x de R$ 187,42", [
            "3 fones Aura ANC",
            "3 estojos de viagem",
            "Garantia de 1 ano",
            "Brinde: 3 capas de silicone",
          ]),
        ],
        {
          align: r("stretch"),
          box: { maxWidth: r("1120px"), width: r("100%") },
        },
        "Kits",
      ),
    ],
    { background: bg(C.surface), box: { anchorId: KITS } },
  );

/* 6. Avaliações (carrossel) */
const REVIEWS: [string, string, string, string][] = [
  [
    "O cancelamento de ruído é absurdo. Uso no metrô e no escritório aberto e esqueço que o mundo existe.",
    "Beatriz Nunes",
    "Compra verificada",
    "1544005313-94ddf0286df2",
  ],
  [
    "Bateria dura a semana toda. Carreguei no domingo e só lembrei de carregar de novo na sexta.",
    "André Luiz",
    "Compra verificada",
    "1560250097-0b93528c311a",
  ],
  [
    "Chegou em dois dias, super bem embalado. O som é muito equilibrado, os graves são lindos.",
    "Fernanda Lima",
    "Compra verificada",
    "1531746020798-e6953c6e8e04",
  ],
  [
    "Uso para reuniões o dia todo e não aperta a cabeça. O microfone também é ótimo.",
    "Ricardo Souza",
    "Compra verificada",
    "1519085360753-af0119f7cbe7",
  ],
  [
    "Comprei o kit com 2 para mim e meu marido. Valeu muito a pena pelo desconto e pelo brinde.",
    "Patrícia Gomes",
    "Compra verificada",
    "1580489944761-15a19d654956",
  ],
];

const reviews = (): NodeSpec =>
  section("Avaliações", [
    ...heading("Avaliações", "Nota 4,9 de 5 em mais de 2.300 avaliações"),
    h(
      "Carousel",
      {
        slidesPerView: r(3, 2, 1),
        gap: r("24px"),
        slideHeight: r("auto"),
        showArrows: r(true, undefined, false),
        arrowPosition: "outside",
        showDots: r(true),
        autoplay: 6,
        loop: true,
        box: { maxWidth: r("1160px"), width: r("100%") },
      },
      REVIEWS.map(([quote, name, role, avatar]) =>
        h(
          "CarouselSlide",
          {
            padding: r(sides("0px")),
            minHeight: r("0px"),
            background: bg("transparent"),
            alignItems: r("stretch"),
          },
          [
            h(
              "Testimonial",
              {
                quote,
                name,
                role,
                avatar: photo(avatar, 160, 1),
                rating: 5,
                background: bg(C.background),
                border: {
                  style: "solid",
                  width: r(sides("1px")),
                  color: C.border,
                  radius: r(corners("20px")),
                },
                padding: r(sides("28px")),
                box: { minHeight: r("100%") },
              },
              [],
              name,
            ),
          ],
          name,
        ),
      ),
      "Avaliações",
    ),
  ]);

/* 7. Dúvidas + botão flutuante do WhatsApp */
const questions = (): NodeSpec =>
  section(
    "Perguntas frequentes",
    [
      ...heading("Dúvidas", "Perguntas frequentes"),
      faq([
        [
          "Qual o prazo de entrega?",
          "Enviamos em até 24 horas úteis. Capitais recebem em 1 a 3 dias úteis; demais regiões, em 3 a 7 dias úteis.",
        ],
        ["O frete é grátis mesmo?", "Sim, para todo o Brasil e em qualquer kit, sem valor mínimo."],
        [
          "Funciona com iPhone e Android?",
          "Funciona com qualquer aparelho com Bluetooth: celulares, tablets, notebooks e TVs.",
        ],
        [
          "Como funciona a troca?",
          "Você tem 30 dias para trocar ou devolver. A coleta é gratuita e o reembolso sai em até 5 dias úteis.",
        ],
        ["Tem garantia?", "Sim, 1 ano de garantia contra defeitos de fabricação, com troca direta pela loja."],
      ]),
      h(
        "FloatingButtons",
        {
          contact: {
            phone: WHATSAPP,
            message: "Olá! Tenho uma dúvida sobre o Fone Aura ANC.",
          },
        },
        [],
        "Botões flutuantes",
      ),
    ],
    { background: bg(C.surface) },
  );

/* 8. Chamada final */
const finalCta = (): NodeSpec =>
  section(
    "Chamada final",
    [
      title("Experimente por 30 dias sem risco", {
        size: r("44px", "36px", "28px"),
      }),
      lead("Se não amar, devolva em até 30 dias. A coleta é por nossa conta e o reembolso é integral."),
      cta("Escolher meu kit", { action: anchor(KITS), icon: "shopping-bag" }),
    ],
    { gap: r("24px") },
  );

export const productPage = (): NodeSpec[] => [
  bar(),
  productHero(),
  features(),
  mood(),
  details(),
  kits(),
  reviews(),
  questions(),
  finalCta(),
];
