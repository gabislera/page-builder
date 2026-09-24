/**
 * "Sales page" template: online course (infoproduct). Classic high-conversion
 * structure: promise + video, proof, who it's for, content, instructor,
 * testimonials, offer with urgency, guarantee, FAQ, and final CTA.
 */
import { h, type NodeSpec } from "../../core/build.ts";
import { corners, defaultShadow, sides } from "../../core/defaults.ts";
import { C } from "../../core/theme.ts";
import {
  anchor,
  bg,
  card,
  checks,
  cta,
  darkGlow,
  faq,
  grid,
  heading,
  lead,
  miniFooter,
  photo,
  picture,
  pill,
  r,
  section,
  stack,
  tint,
  title,
  white,
} from "./shared.ts";

const OFFER = "oferta";
const buy = (text = "Quero garantir minha vaga", light = false, align: "center" | "flex-start" = "center") =>
  cta(text, { action: anchor(OFFER), light, align });

/* 1. Dark hero: promise, video, and CTA */
const hero = (): NodeSpec =>
  section(
    "Hero",
    [
      pill("Turma 2026 · Inscrições abertas", {
        color: "#ffffff",
        background: white(8),
      }),
      title("Do zero ao seu primeiro emprego como desenvolvedor front-end", {
        tag: "h1",
        color: "#ffffff",
        size: r("60px", "46px", "34px"),
        maxWidth: "900px",
      }),
      lead(
        "Um método prático, com projetos reais e acompanhamento de perto, para você aprender HTML, CSS, JavaScript e React e montar um portfólio que chama a atenção das empresas.",
        { color: white(72), maxWidth: "720px" },
      ),
      h(
        "Video",
        {
          url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
          title: "Apresentação do curso",
          thumbnail: photo("1517694712202-14dd9538aa97", 1600, 16 / 9),
          playIconBackground: C.primary,
          border: {
            style: "solid",
            width: r(sides("1px")),
            color: white(12),
            radius: r(corners("20px")),
          },
          shadow: defaultShadow({
            enabled: true,
            y: 40,
            blur: 90,
            spread: -20,
            color: tint(C.primary, 45),
          }),
          box: {
            maxWidth: r("880px"),
            width: r("100%"),
            margin: r(sides("12px", "0px", "8px")),
          },
        },
        [],
        "Vídeo",
      ),
      buy(),
      checks(["Acesso vitalício", "Certificado", "Suporte com instrutores"], {
        layout: r("horizontal", undefined, "vertical"),
        color: white(75),
        iconColor: C.primary,
        size: r("15px"),
        align: "center",
      }),
    ],
    {
      background: darkGlow(),
      padding: r(sides("96px", "24px", "112px"), undefined, sides("56px", "16px", "64px")),
      gap: r("28px", undefined, "22px"),
    },
  );

/* 2. Stats (social proof) */
const stat = (value: number, label: string, extra: Record<string, unknown> = {}) =>
  h(
    "StatCounter",
    {
      value,
      label,
      numberTypography: {
        fontSize: r("44px", undefined, "34px"),
        fontWeight: "800",
        color: C.text,
      },
      ...extra,
    },
    [],
    "Número",
  );

const stats = (): NodeSpec =>
  section(
    "Números",
    [
      grid(
        r(4, 4, 2),
        [
          stat(12000, "alunos formados"),
          stat(4.9, "de avaliação média", {
            decimals: 1,
            prefix: "",
            suffix: "/5",
          }),
          stat(87, "empregados em 6 meses", { prefix: "", suffix: "%" }),
          stat(160, "horas de conteúdo", { prefix: "", suffix: "h" }),
        ],
        { box: { maxWidth: r("1080px"), width: r("100%") }, gap: r("32px") },
        "Números",
      ),
    ],
    {
      padding: r(sides("56px", "24px"), undefined, sides("40px", "16px")),
      border: {
        style: "solid",
        width: r({ top: "0px", right: "0px", bottom: "1px", left: "0px" }),
        color: C.border,
        radius: r(corners("0px")),
      },
    },
  );

/* 3. Who it's for */
const forWho = (): NodeSpec =>
  section("Para quem é", [
    grid(
      r(2, 1, 1),
      [
        picture(photo("1522202176988-66273c2fd55f", 1200, 1.1), "Alunos estudando juntos", {
          height: r("520px", "420px", "300px"),
        }),
        stack(
          [
            ...heading("Para quem é", "Feito para quem quer mudar de vida pela tecnologia", undefined, {
              align: "left",
            }),
            checks([
              "Você nunca programou e quer começar do jeito certo",
              "Já estudou sozinho, mas se perdeu em tutoriais soltos",
              "Quer trocar de área e precisa de um plano claro",
              "Busca um portfólio com projetos que impressionam",
              "Quer estudar no seu ritmo, com suporte quando travar",
            ]),
            buy("Quero começar agora", false, "flex-start"),
          ],
          { gap: r("24px"), align: r("flex-start") },
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

/* 4. What you'll learn */
const skill = (icon: string, t: string, d: string) =>
  h(
    "IconBox",
    {
      icon: { name: icon, size: r("26px"), padding: r("14px") },
      title: t,
      description: d,
      padding: r(sides("28px")),
      background: bg(C.background),
      border: {
        style: "solid",
        width: r(sides("1px")),
        color: C.border,
        radius: r(corners("20px")),
      },
      hoverLift: "6px",
      hoverShadow: defaultShadow({
        enabled: true,
        y: 20,
        blur: 40,
        spread: -16,
        color: "rgba(15, 23, 42, .18)",
      }),
    },
    [],
    t,
  );

const skills = (): NodeSpec =>
  section(
    "O que você vai aprender",
    [
      ...heading(
        "O que você vai aprender",
        "Tudo o que o mercado pede, na ordem certa",
        "Uma trilha pensada para você sair do básico e chegar ao nível que as empresas contratam, sem lacunas.",
      ),
      grid(
        r(3, 2, 1),
        [
          skill(
            "code",
            "HTML e CSS modernos",
            "Layouts responsivos com Flexbox e Grid, acessibilidade e boas práticas desde o primeiro dia.",
          ),
          skill(
            "braces",
            "JavaScript de verdade",
            "Lógica, DOM, APIs e assíncrono explicados com exemplos que você usa no dia a dia.",
          ),
          skill(
            "atom",
            "React do jeito certo",
            "Componentes, estado, hooks e consumo de APIs em aplicações completas.",
          ),
          skill("git-branch", "Git e GitHub", "Versionamento, pull requests e o fluxo de trabalho usado nas equipes."),
          skill(
            "layout-template",
            "Portfólio profissional",
            "Cinco projetos reais publicados, prontos para mostrar nas entrevistas.",
          ),
          skill(
            "briefcase",
            "Carreira e entrevistas",
            "Currículo, LinkedIn, testes técnicos e simulações de entrevista.",
          ),
        ],
        { box: { maxWidth: r("1160px"), width: r("100%") } },
        "Habilidades",
      ),
    ],
    { background: bg(C.surface) },
  );

/* 5. Module grid */
const MODULES: [string, string][] = [
  ["Módulo 1 · Fundamentos da web", "Como a internet funciona, HTML semântico, CSS e seu primeiro site no ar."],
  ["Módulo 2 · Layouts responsivos", "Flexbox, Grid, unidades relativas e design que funciona em qualquer tela."],
  [
    "Módulo 3 · JavaScript essencial",
    "Variáveis, funções, arrays, objetos e manipulação do DOM com projetos práticos.",
  ],
  ["Módulo 4 · JavaScript avançado", "Promises, async/await, consumo de APIs e organização de código."],
  ["Módulo 5 · React", "Componentes, props, estado, hooks e rotas em uma aplicação completa."],
  ["Módulo 6 · Carreira", "Portfólio, currículo, LinkedIn e preparação para entrevistas técnicas."],
];

const modules = (): NodeSpec =>
  section("Conteúdo do curso", [
    grid(
      r(2, 1, 1),
      [
        stack(
          [
            ...heading(
              "Conteúdo",
              "6 módulos, mais de 160 horas de prática",
              "Aulas curtas e diretas, exercícios em cada etapa e projetos que viram portfólio. Você acessa quando quiser, pelo computador ou pelo celular.",
              { align: "left" },
            ),
            buy("Ver a oferta", false, "flex-start"),
          ],
          { gap: r("24px"), align: r("flex-start") },
        ),
        faq(MODULES, {
          firstOpen: true,
          box: { width: r("100%") },
        }),
      ],
      {
        columnsTemplate: r("2fr 3fr"),
        gap: r("64px", "40px", "32px"),
        align: r("flex-start"),
        box: { maxWidth: r("1160px"), width: r("100%") },
      },
      "Colunas",
    ),
  ]);

/* 6. Instructor */
const teacher = (): NodeSpec =>
  section(
    "Professor",
    [
      grid(
        r(2, 1, 1),
        [
          stack(
            [
              ...heading("Quem vai te ensinar", "Rafael Moreira", undefined, {
                align: "left",
                dark: true,
              }),
              lead(
                "<p>Desenvolvedor há 12 anos, passou por startups e grandes empresas de tecnologia e liderou times de front-end. Já ajudou mais de 12 mil alunos a conquistar a primeira vaga na área.</p><p>Aqui ele ensina o que usa todos os dias, sem enrolação e com foco no que o mercado realmente cobra.</p>",
                { align: "left", color: white(72) },
              ),
              checks(
                ["Ex-líder técnico de front-end", "Mentor de mais de 300 devs", "Palestrante em eventos de tecnologia"],
                { color: white(85) },
              ),
            ],
            { gap: r("22px") },
          ),
          picture(photo("1507003211169-0a1dd7228f2d", 1000, 0.9), "Foto do professor", {
            height: r("540px", "460px", "360px"),
          }),
        ],
        {
          gap: r("64px", "40px", "32px"),
          align: r("center"),
          box: { maxWidth: r("1080px"), width: r("100%") },
        },
        "Colunas",
      ),
    ],
    { background: darkGlow(200) },
  );

/* 7. Testimonials */
const review = (quote: string, name: string, role: string, avatar: string) =>
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
    },
    [],
    name,
  );

const reviews = (): NodeSpec =>
  section(
    "Depoimentos",
    [
      ...heading(
        "Depoimentos",
        "Quem fez, recomenda",
        "Histórias reais de alunos que mudaram de carreira com a formação.",
      ),
      grid(
        r(3, 1, 1),
        [
          review(
            "Saí do atendimento ao cliente e em 7 meses consegui minha primeira vaga como dev júnior. Os projetos do portfólio fizeram toda a diferença na entrevista.",
            "Camila Rocha",
            "Dev front-end júnior",
            "1494790108377-be9c29b29330",
          ),
          review(
            "Já tinha tentado aprender sozinho várias vezes. Aqui foi a primeira vez que entendi JavaScript de verdade. O suporte responde rápido e sem julgamento.",
            "Lucas Ferreira",
            "Desenvolvedor React",
            "1500648767791-00dcc994a43e",
          ),
          review(
            "A parte de carreira vale o curso inteiro. Refiz meu LinkedIn, treinei as entrevistas e recebi duas propostas no mesmo mês.",
            "Juliana Alves",
            "Dev front-end pleno",
            "1438761681033-6461ffad8d80",
          ),
        ],
        { box: { maxWidth: r("1160px"), width: r("100%") } },
        "Depoimentos",
      ),
    ],
    { background: bg(C.surface) },
  );

/* 8. Offer */
const offer = (): NodeSpec =>
  section(
    "Oferta",
    [
      ...heading(
        "Oferta especial",
        "Tudo o que você recebe hoje",
        "Condição de lançamento por tempo limitado. Depois do prazo, o valor volta ao preço normal.",
        { dark: true },
      ),
      h(
        "Countdown",
        {
          mode: "evergreen",
          durationMinutes: 60 * 24,
          show: { days: false, hours: true, minutes: true, seconds: true },
          align: r("center"),
          unitBackground: white(8),
          unitBorder: {
            style: "solid",
            width: r(sides("1px")),
            color: white(14),
            radius: r(corners("14px")),
          },
          numberTypography: { color: "#ffffff" },
          labelTypography: { color: white(60) },
        },
        [],
        "Contagem regressiva",
      ),
      grid(
        r(2, 1, 1),
        [
          card(
            [
              title("Você leva", {
                align: "left",
                size: r("24px"),
                maxWidth: "100%",
              }),
              checks(
                [
                  "Formação completa: 6 módulos e 160h de aula",
                  "5 projetos reais para o seu portfólio",
                  "Comunidade exclusiva de alunos",
                  "Suporte com instrutores por 12 meses",
                  "Bônus: mentoria de carreira em grupo",
                  "Bônus: banco de testes técnicos resolvidos",
                  "Certificado de conclusão",
                ],
                { size: r("16px") },
              ),
            ],
            {
              gap: r("20px"),
              box: { padding: r(sides("36px"), undefined, sides("24px")) },
            },
            "O que você recebe",
          ),
          h(
            "PricingTable",
            {
              name: "Formação Front-end",
              description: "Acesso completo + todos os bônus",
              oldPrice: "R$ 1.997",
              currency: "R$",
              amount: "997",
              cents: "",
              period: "à vista",
              installments: "ou 12x de R$ 99,70",
              features: [],
              ctaText: "Quero me inscrever agora",
              footerNote: "Compra segura · 7 dias de garantia",
              footerIcon: "shield-check",
              featured: true,
              badgeText: "Oferta de lançamento",
              featuredScale: 1,
              align: "center",
              priceTypography: { fontSize: r("64px", undefined, "52px") },
              padding: r(sides("40px", "32px"), undefined, sides("32px", "24px")),
            },
            [],
            "Preço",
          ),
        ],
        {
          gap: r("24px"),
          align: r("center"),
          box: { maxWidth: r("1000px"), width: r("100%") },
        },
        "Oferta",
      ),
    ],
    { background: darkGlow(20), box: { anchorId: OFFER } },
  );

/* 9. Guarantee */
const guarantee = (): NodeSpec =>
  section(
    "Garantia",
    [
      h(
        "IconBox",
        {
          icon: {
            name: "shield-check",
            size: r("44px"),
            padding: r("22px"),
            shape: "circle",
            color: "#16a34a",
            background: tint("#16a34a", 12),
          },
          iconPosition: r("left", undefined, "top"),
          iconVerticalAlign: "center",
          align: r("left", undefined, "center"),
          title: "Garantia incondicional de 7 dias",
          titleTypography: {
            fontSize: r("26px", undefined, "22px"),
            fontWeight: "800",
          },
          description:
            "Entre, assista às aulas e faça os primeiros projetos. Se em até 7 dias você achar que não é para você, devolvemos 100% do valor. Sem perguntas e sem burocracia.",
          descriptionTypography: { fontSize: r("17px", undefined, "16px") },
          iconSpacing: r("28px"),
          padding: r(sides("40px"), undefined, sides("28px")),
          background: bg(C.background),
          border: {
            style: "dashed",
            width: r(sides("2px")),
            color: tint("#16a34a", 40),
            radius: r(corners("24px")),
          },
          hoverLift: "0px",
          box: { maxWidth: r("860px"), width: r("100%") },
        },
        [],
        "Garantia",
      ),
    ],
    { padding: r(sides("88px", "24px"), undefined, sides("56px", "16px")) },
  );

/* 10. FAQ */
const questions = (): NodeSpec =>
  section(
    "Perguntas frequentes",
    [
      ...heading("Dúvidas", "Perguntas frequentes"),
      faq([
        [
          "Preciso saber alguma coisa de programação?",
          "Não. A formação começa do absoluto zero e avança passo a passo, com exercícios em cada etapa.",
        ],
        [
          "Por quanto tempo terei acesso?",
          "O acesso às aulas é vitalício, incluindo as atualizações futuras do conteúdo.",
        ],
        [
          "Quanto tempo por dia preciso estudar?",
          "Com 1 hora por dia você conclui a formação em cerca de 6 meses. Você define o seu ritmo.",
        ],
        [
          "Recebo certificado?",
          "Sim. Ao concluir os módulos e os projetos, você recebe o certificado digital de conclusão.",
        ],
        [
          "Quais são as formas de pagamento?",
          "Cartão de crédito em até 12x, Pix ou boleto. O acesso chega no seu e-mail logo após a confirmação.",
        ],
        ["E se eu não gostar?", "Você tem 7 dias de garantia incondicional. É só pedir e devolvemos 100% do valor."],
      ]),
    ],
    { background: bg(C.surface) },
  );

/* 11. Final CTA */
const finalCta = (): NodeSpec =>
  section(
    "Chamada final",
    [
      title("Sua nova carreira começa com uma decisão", {
        color: "#ffffff",
        size: r("48px", "38px", "30px"),
      }),
      lead("Garanta sua vaga com a condição de lançamento e comece hoje mesmo.", {
        color: white(80),
      }),
      buy("Quero garantir minha vaga", true),
    ],
    {
      background: {
        type: "gradient",
        color: C.primary,
        gradient: {
          type: "linear",
          angle: 135,
          from: C.primary,
          fromPosition: 0,
          to: `color-mix(in srgb, ${C.primary} 55%, ${C.secondary})`,
          toPosition: 100,
        },
      },
      gap: r("24px"),
    },
  );

export const salesPage = (): NodeSpec[] => [
  hero(),
  stats(),
  forWho(),
  skills(),
  modules(),
  teacher(),
  reviews(),
  offer(),
  guarantee(),
  questions(),
  finalCta(),
  miniFooter(
    '© 2026 Formação Front-end · Todos os direitos reservados · <a href="#">Termos de uso</a> · <a href="#">Privacidade</a>',
  ),
];
