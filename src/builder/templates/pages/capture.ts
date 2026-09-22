/**
 * Modelo "Página de captura": aula gratuita ao vivo. Uma promessa forte e o
 * formulário logo na primeira dobra; o resto da página reforça o convite
 * (o que vai aprender, quem apresenta) e leva de volta ao formulário.
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
	grid,
	heading,
	lead,
	miniFooter,
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

const FORM = "inscricao";
const join = (text = "Quero minha vaga gratuita", light = false) =>
	cta(text, { action: anchor(FORM), light });

/* 1. Primeira dobra: promessa + formulário */
const hero = (): NodeSpec =>
	section(
		"Inscrição",
		[
			grid(
				r(2, 1, 1),
				[
					stack(
						[
							pill("Aula gratuita e ao vivo · Quinta, às 20h", {
								align: "flex-start",
							}),
							title(
								"Como vender todos os dias no Instagram sem depender de anúncios",
								{
									tag: "h1",
									align: "left",
									size: r("54px", "44px", "34px"),
									maxWidth: "640px",
								},
							),
							lead(
								"Em uma aula prática de 90 minutos, você vai aprender o método que transforma seguidores em clientes, com conteúdo que vende sem parecer venda.",
								{ align: "left", maxWidth: "580px" },
							),
							checks(
								[
									"O roteiro de conteúdo que atrai compradores",
									"Como usar os stories para vender todos os dias",
									"A mensagem que converte curiosos em clientes no direct",
								],
								{ size: r("17px", undefined, "16px") },
							),
							row(
								[
									h(
										"Text",
										{
											html: "<p>★★★★★</p>",
											typography: {
												fontSize: r("18px"),
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
											html: "<p><strong>+8.400 pessoas</strong> já garantiram a vaga</p>",
											typography: { fontSize: r("15px"), color: C.textMuted },
										},
										[],
										"Prova social",
									),
								],
								{
									gap: r("10px"),
									box: { margin: r(sides("8px", "0px", "0px")) },
								},
								"Prova social",
							),
						],
						{ gap: r("24px"), align: r("flex-start") },
						"Promessa",
					),
					card(
						[
							title("Garanta sua vaga gratuita", {
								align: "left",
								size: r("26px", undefined, "22px"),
								maxWidth: "100%",
							}),
							lead(
								"Preencha os dados abaixo e receba o link da aula no seu e-mail e WhatsApp.",
								{
									align: "left",
									size: r("15px"),
									maxWidth: "100%",
								},
							),
							h(
								"Form",
								{
									formName: "Aula gratuita",
									tags: "aula-gratuita",
									submitText: "Quero participar gratuitamente",
									submitIcon: "arrow-right",
									showLabels: false,
									inputHeight: r("52px"),
									gap: r("14px"),
									successMessage:
										"Inscrição confirmada! Enviamos o link da aula para o seu e-mail e WhatsApp.",
									submit: {
										padding: r(sides("18px", "24px")),
										typography: { fontSize: r("17px"), fontWeight: "700" },
										border: { radius: r(corners("12px")) },
									},
								},
								[],
								"Formulário",
							),
							checks(["Seus dados estão protegidos. Nada de spam."], {
								icon: "lock",
								iconColor: C.textMuted,
								color: C.textMuted,
								size: r("13px"),
							}),
						],
						{
							gap: r("16px"),
							border: {
								style: "solid",
								width: r(sides("1px")),
								color: C.border,
								radius: r(corners("24px")),
							},
							shadow: defaultShadow({
								enabled: true,
								y: 30,
								blur: 70,
								spread: -24,
								color: tint(C.primary, 35),
							}),
							box: { padding: r(sides("36px"), undefined, sides("24px")) },
						},
						"Formulário de inscrição",
					),
				],
				{
					columnsTemplate: r("7fr 5fr"),
					gap: r("64px", "40px", "36px"),
					align: r("center"),
					box: { maxWidth: r("1180px"), width: r("100%") },
				},
				"Colunas",
			),
		],
		{
			minHeight: r("100vh", "0px"),
			padding: r(
				sides("80px", "24px"),
				undefined,
				sides("40px", "16px", "56px"),
			),
			background: {
				type: "gradient",
				color: C.background,
				gradient: {
					type: "linear",
					angle: 160,
					from: `color-mix(in srgb, ${C.primary} 9%, ${C.background})`,
					fromPosition: 0,
					to: C.background,
					toPosition: 70,
				},
			},
			box: { anchorId: FORM },
		},
	);

/* 2. O que você vai aprender */
const step = (n: string, t: string, d: string) =>
	card(
		[
			h(
				"Heading",
				{
					text: n,
					tag: "p",
					typography: {
						fontSize: r("44px"),
						fontWeight: "800",
						lineHeight: r("1"),
						color: tint(C.primary, 35),
					},
				},
				[],
				"Número",
			),
			title(t, {
				align: "left",
				size: r("22px", undefined, "20px"),
				tag: "h3",
				maxWidth: "100%",
			}),
			lead(d, { align: "left", size: r("16px"), maxWidth: "100%" }),
		],
		{ gap: r("12px") },
		t,
	);

const learn = (): NodeSpec =>
	section(
		"O que você vai aprender",
		[
			...heading(
				"Nesta aula",
				"Você vai sair com um plano pronto para aplicar",
				"Nada de teoria solta: cada parte da aula termina com uma ação para você colocar em prática no mesmo dia.",
			),
			grid(
				r(3, 1, 1),
				[
					step(
						"01",
						"Posicionamento que atrai",
						"Como deixar claro, em segundos, para quem você vende e por que escolher você.",
					),
					step(
						"02",
						"Conteúdo que vende",
						"O calendário de posts e stories que educa, gera desejo e prepara a venda.",
					),
					step(
						"03",
						"Conversa que converte",
						"Os roteiros de direct para transformar interessados em clientes, sem ser insistente.",
					),
				],
				{ box: { maxWidth: r("1120px"), width: r("100%") } },
				"Etapas",
			),
		],
		{ background: bg(C.surface) },
	);

/* 3. Quem apresenta */
const mini = (
	value: number,
	label: string,
	extra: Record<string, unknown> = {},
) =>
	h(
		"StatCounter",
		{
			value,
			label,
			align: r("flex-start"),
			numberTypography: {
				fontSize: r("34px", undefined, "28px"),
				color: "#ffffff",
			},
			labelTypography: { fontSize: r("14px"), color: white(65) },
			...extra,
		},
		[],
		"Número",
	);

const host = (): NodeSpec =>
	section(
		"Quem apresenta",
		[
			grid(
				r(2, 1, 1),
				[
					picture(
						photo("1573496359142-b8d87734a5a2", 1000, 0.85),
						"Foto da apresentadora",
						{
							height: r("560px", "460px", "380px"),
						},
					),
					stack(
						[
							...heading("Quem apresenta", "Mariana Costa", undefined, {
								align: "left",
								dark: true,
							}),
							lead(
								"<p>Estrategista de marketing digital, ajudou mais de 3 mil negócios a vender pelo Instagram. Começou do zero, com um perfil de 200 seguidores, e hoje ensina o método que usa na própria empresa.</p>",
								{ align: "left", color: white(72) },
							),
							grid(
								r(3, 3, 3),
								[
									mini(250, "seguidores", { suffix: "k", thousands: false }),
									mini(3000, "alunos"),
									mini(8, "anos no mercado", { prefix: "" }),
								],
								{
									gap: r("16px"),
									box: { margin: r(sides("12px", "0px", "0px")) },
								},
								"Números",
							),
						],
						{ gap: r("22px") },
					),
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

/* 4. Chamada final */
const finalCta = (): NodeSpec =>
	section(
		"Chamada final",
		[
			title("As vagas da aula ao vivo são limitadas", {
				size: r("44px", "36px", "28px"),
			}),
			lead(
				"A sala tem capacidade máxima. Garanta a sua agora e receba o lembrete antes de começar.",
			),
			join(),
		],
		{ gap: r("24px") },
	);

export const capturePage = (): NodeSpec[] => [
	hero(),
	learn(),
	host(),
	finalCta(),
	miniFooter(
		'© 2026 Mariana Costa · Todos os direitos reservados · <a href="#">Privacidade</a>',
		false,
	),
];
