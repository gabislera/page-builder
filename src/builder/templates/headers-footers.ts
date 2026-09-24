/**
 * Modelos prontos de cabeçalho e rodapé, montados com elementos comuns
 * (Logo, Menu, Botão, Container, Texto...), que o usuário edita livremente.
 */
import { containerPresets } from "../components/container.tsx";
import { h, type NodeSpec } from "../core/build.ts";
import { defaultBackground, sides } from "../core/defaults.ts";
import { responsive } from "../core/responsive.ts";
import { C } from "../core/theme.ts";
import type { SectionTemplate } from "./sections.ts";

const uid = () => Math.random().toString(36).slice(2, 10);

const WHITE = "#ffffff";
const WHITE_MUTED = "#ffffffb3";

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

const link = (text: string, children: string[] = []) => ({
  id: uid(),
  text,
  action: { type: "section", sectionId: "" },
  children: children.map((t) => ({
    id: uid(),
    text: t,
    action: { type: "section", sectionId: "" },
  })),
});

const navItems = () => [
  link("Início"),
  link("Sobre"),
  link("Serviços", ["Consultoria", "Treinamentos", "Suporte"]),
  link("Contato"),
];

const logo = (props: Record<string, unknown> = {}) => h("Logo", props);

const menu = (props: Record<string, unknown> = {}) => h("Menu", { items: navItems(), ...props });

/** Botão de chamada do cabeçalho: compacto e oculto no celular. */
const headerButton = (props: Record<string, unknown> = {}) =>
  h("Button", {
    text: "Fale conosco",
    icon: "",
    fullWidth: responsive(false),
    padding: responsive(sides("10px", "20px")),
    typography: { fontSize: responsive("15px") },
    background: defaultBackground({ type: "color", color: C.primary }),
    shadow: { enabled: false },
    hover: { enabled: true, background: "", opacity: 0.9, scale: 1 },
    box: {
      alignSelf: responsive("center"),
      visible: responsive(true, undefined, false),
    },
    ...props,
  });

/** Linha centralizada na largura do conteúdo (dentro de cabeçalho em largura total). */
const contentRow = (children: NodeSpec[], props: Record<string, unknown> = {}, name?: string) =>
  h(
    "Container",
    {
      ...containerPresets.row,
      direction: responsive("row"),
      justify: responsive("space-between"),
      align: responsive("center"),
      gap: responsive("24px", undefined, "16px"),
      ...props,
    },
    children,
    name,
  );

/* Rodapé escuro */

const footerText = (html: string, typography: Record<string, unknown> = {}) =>
  h("Text", {
    html,
    typography: {
      fontSize: responsive("15px"),
      lineHeight: responsive("1.6"),
      color: WHITE_MUTED,
      ...typography,
    },
    linkColor: WHITE,
  });

const copyright = (align: "left" | "center", color = WHITE_MUTED) =>
  h(
    "Text",
    {
      html: "<p>© {ano} Sua marca. Todos os direitos reservados.</p>",
      typography: {
        fontSize: responsive("14px"),
        color,
        textAlign: responsive(align),
      },
    },
    [],
    "Copyright",
  );

const columnTitle = (text: string) =>
  h("Heading", {
    text,
    tag: "h4",
    typography: {
      fontSize: responsive("15px"),
      fontWeight: "600",
      lineHeight: responsive("1.4"),
      color: WHITE,
    },
  });

const footerMenu = (labels: string[]) =>
  h("Menu", {
    items: labels.map((t) => link(t)),
    orientation: "vertical",
    align: responsive("flex-start"),
    gap: responsive("2px"),
    itemPadding: responsive(sides("4px", "0px")),
    typography: {
      fontSize: responsive("15px"),
      fontWeight: "400",
      color: WHITE_MUTED,
    },
    hoverColor: WHITE,
    activeColor: WHITE,
  });

const footerSocials = (props: Record<string, unknown> = {}) =>
  h("SocialIcons", {
    colorMode: "custom",
    iconColor: WHITE,
    background: "#ffffff1a",
    hoverIconColor: WHITE,
    hoverBackground: C.primary,
    size: responsive("36px"),
    iconSize: responsive("16px"),
    ...props,
  });

const footerLogo = () => logo({ variant: "light", typography: { color: WHITE } });

const divider = (color = "#ffffff1f") => h("Divider", { color, box: { padding: responsive(sides("0px")) } });

const column = (children: NodeSpec[], gap = "16px") =>
  h("Container", { ...containerPresets.stack, gap: responsive(gap) }, children, "Coluna");

const linkColumn = (title: string, links: string[]) => column([columnTitle(title), footerMenu(links)], "12px");

const brandColumn = () =>
  column([
    footerLogo(),
    footerText("<p>Uma frase curta sobre a sua marca e o que ela entrega para os clientes.</p>"),
    footerSocials(),
  ]);

/* ------------------------------------------------------------------ */
/* Modelos                                                             */
/* ------------------------------------------------------------------ */

export const HEADER_FOOTER_TEMPLATES: SectionTemplate[] = [
  {
    id: "header-menu-right",
    category: "Cabeçalho",
    name: "Logo e menu à direita",
    kind: "header",
    build: () =>
      h(
        "Header",
        {},
        [
          logo(),
          contentRow(
            [menu({ align: responsive("flex-end") }), headerButton()],
            {
              justify: responsive("flex-end"),
              gap: responsive("16px"),
              box: { width: responsive("auto") },
            },
            "Menu e botão",
          ),
        ],
        "Cabeçalho",
      ),
  },
  {
    id: "header-menu-center",
    category: "Cabeçalho",
    name: "Menu centralizado",
    kind: "header",
    build: () => h("Header", {}, [logo(), menu({ align: responsive("center") }), headerButton()], "Cabeçalho"),
  },
  {
    id: "header-logo-center",
    category: "Cabeçalho",
    name: "Logo centralizado",
    kind: "header",
    build: () =>
      h(
        "Header",
        {
          direction: responsive("column", "row"),
          justify: responsive("center", "space-between"),
          align: responsive("center"),
          gap: responsive("8px", "16px"),
          padding: responsive(sides("20px", "24px", "8px"), sides("12px", "24px"), sides("10px", "16px")),
        },
        [logo({ maxHeight: responsive("48px", "36px", "32px") }), menu({ align: responsive("center") })],
        "Cabeçalho",
      ),
  },
  {
    id: "header-topbar",
    category: "Cabeçalho",
    name: "Com barra de contato",
    kind: "header",
    build: () =>
      h(
        "Header",
        {
          fullWidth: true,
          direction: responsive("column"),
          align: responsive("stretch"),
          gap: responsive("0px"),
          padding: responsive(sides("0px")),
        },
        [
          h(
            "Container",
            {
              ...containerPresets.stack,
              background: defaultBackground({
                type: "color",
                color: C.secondary,
              }),
              box: {
                padding: responsive(sides("8px", "24px")),
                visible: responsive(true, undefined, false),
              },
            },
            [
              contentRow(
                [
                  h(
                    "Text",
                    {
                      html: "<p>contato@suamarca.com.br&nbsp;&nbsp;·&nbsp;&nbsp;(11) 99999-9999</p>",
                      typography: {
                        fontSize: responsive("13px"),
                        color: WHITE_MUTED,
                      },
                    },
                    [],
                    "Contato",
                  ),
                  h("SocialIcons", {
                    shape: "none",
                    colorMode: "custom",
                    iconColor: WHITE_MUTED,
                    hoverIconColor: WHITE,
                    size: responsive("24px"),
                    iconSize: responsive("15px"),
                    gap: responsive("12px"),
                  }),
                ],
                {
                  direction: responsive("row"),
                  box: {
                    maxWidth: responsive("var(--pb-content-width)"),
                    margin: responsive(sides("0px", "auto")),
                  },
                },
              ),
            ],
            "Barra de contato",
          ),
          contentRow(
            [logo(), menu({ align: responsive("center") }), headerButton()],
            {
              box: {
                maxWidth: responsive("var(--pb-content-width)"),
                margin: responsive(sides("0px", "auto")),
                padding: responsive(sides("14px", "24px"), undefined, sides("10px", "16px")),
              },
            },
            "Linha principal",
          ),
        ],
        "Cabeçalho",
      ),
  },
  {
    id: "header-dark-transparent",
    category: "Cabeçalho",
    name: "Escuro transparente",
    kind: "header",
    build: () =>
      h(
        "Header",
        {
          transparent: true,
          sticky: true,
          background: defaultBackground({ type: "color", color: C.secondary }),
          scrolledBackground: C.secondary,
          borderBottom: false,
          padding: responsive(sides("20px", "24px"), undefined, sides("12px", "16px")),
          shrinkOnScroll: true,
          shrinkPadding: "12px",
        },
        [
          logo({ variant: "light", typography: { color: WHITE } }),
          menu({
            align: responsive("center"),
            typography: { color: WHITE },
            hoverColor: WHITE_MUTED,
            activeColor: WHITE,
            indicator: "underline",
            indicatorColor: WHITE,
            toggleColor: WHITE,
          }),
          headerButton({ text: "Começar agora" }),
        ],
        "Cabeçalho",
      ),
  },
  {
    id: "footer-columns",
    category: "Rodapé",
    name: "Colunas com links",
    kind: "footer",
    build: () =>
      h(
        "Footer",
        {},
        [
          h(
            "Container",
            {
              ...containerPresets.grid(4),
              gap: responsive("40px", "32px", "28px"),
            },
            [
              brandColumn(),
              linkColumn("Produto", ["Recursos", "Planos", "Novidades"]),
              linkColumn("Empresa", ["Sobre nós", "Blog", "Contato"]),
              linkColumn("Suporte", ["Central de ajuda", "Termos de uso", "Privacidade"]),
            ],
            "Colunas",
          ),
          divider(),
          copyright("left"),
        ],
        "Rodapé",
      ),
  },
  {
    id: "footer-centered",
    category: "Rodapé",
    name: "Simples centralizado",
    kind: "footer",
    build: () =>
      h(
        "Footer",
        { alignItems: responsive("center"), gap: responsive("24px") },
        [
          footerLogo(),
          h("Menu", {
            items: navItems().map((i) => ({ ...i, children: [] })),
            collapseOn: "never",
            align: responsive("center"),
            gap: responsive("8px", undefined, "0px"),
            typography: { color: WHITE_MUTED, fontWeight: "400" },
            hoverColor: WHITE,
            activeColor: WHITE,
          }),
          footerSocials({ align: responsive("center") }),
          copyright("center"),
        ],
        "Rodapé",
      ),
  },
  {
    id: "footer-minimal",
    category: "Rodapé",
    name: "Minimalista",
    kind: "footer",
    build: () =>
      h(
        "Footer",
        {
          padding: responsive(sides("24px"), undefined, sides("24px", "16px")),
          textColor: C.text,
          background: defaultBackground({ type: "color", color: C.surface }),
          border: {
            style: "solid",
            width: responsive(sides("1px", "0px", "0px", "0px")),
            color: C.border,
          },
        },
        [
          contentRow(
            [
              copyright("left", C.textMuted),
              h("SocialIcons", {
                shape: "none",
                colorMode: "custom",
                iconColor: C.textMuted,
                hoverIconColor: C.primary,
                size: responsive("32px"),
                iconSize: responsive("18px"),
                gap: responsive("8px"),
              }),
            ],
            {
              direction: responsive("row", undefined, "column"),
              gap: responsive("16px"),
              box: { width: responsive("100%") },
            },
          ),
        ],
        "Rodapé",
      ),
  },
  {
    id: "footer-newsletter",
    category: "Rodapé",
    name: "Com newsletter",
    kind: "footer",
    build: () =>
      h(
        "Footer",
        {},
        [
          h(
            "Container",
            {
              ...containerPresets.grid(3),
              gap: responsive("48px", "32px", "28px"),
            },
            [
              brandColumn(),
              linkColumn("Links rápidos", ["Início", "Sobre", "Serviços", "Contato"]),
              column(
                [
                  columnTitle("Receba novidades"),
                  footerText("<p>Conteúdos e ofertas exclusivas direto no seu e-mail.</p>"),
                  h("Form", {
                    formName: "Newsletter",
                    tags: "newsletter",
                    fields: [
                      {
                        id: uid(),
                        type: "email",
                        name: "email",
                        label: "E-mail",
                        placeholder: "seu@email.com",
                        required: true,
                        options: "",
                        value: "",
                        showCountry: true,
                        country: "55",
                      },
                    ],
                    showLabels: false,
                    requiredMark: false,
                    gap: responsive("10px"),
                    submitText: "Inscrever",
                    submitIcon: "",
                    successMessage: "Inscrição confirmada. Obrigado!",
                    successColor: "#4ade80",
                    submit: {
                      padding: responsive(sides("14px", "24px")),
                      typography: { fontSize: responsive("15px") },
                      background: defaultBackground({
                        type: "color",
                        color: C.primary,
                      }),
                      shadow: { enabled: false },
                      hover: {
                        enabled: true,
                        background: "",
                        opacity: 0.9,
                        scale: 1,
                      },
                    },
                  }),
                ],
                "12px",
              ),
            ],
            "Colunas",
          ),
          divider(),
          copyright("left"),
        ],
        "Rodapé",
      ),
  },
];
