<div align="center">

# Page Builder

**Construtor visual de landing pages, com IA que monta seções e páginas inteiras.**

Arraste seções, edite direto no canvas, veja como fica no celular e publique em HTML estático e rápido.

![React](https://img.shields.io/badge/React_19-20232a?logo=react&logoColor=61dafb)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-ff4154?logo=reactquery&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06b6d4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169e1?logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-10b981?logo=openai&logoColor=white)

[Recursos](#recursos) · [Stack](#stack) · [Como rodar](#como-rodar) · [Arquitetura](#arquitetura)

</div>

---

## Recursos

### Editor
- **Arrastar e soltar por seções**, com mais de 30 componentes: títulos, botões, formulários, galerias, abas, carrossel, FAQ, tabela de preços, contagem regressiva, depoimentos e outros.
- **Responsivo de verdade**: cada propriedade pode ter um valor para desktop, tablet e celular, e o canvas mostra exatamente o que vai ao ar.
- **Edição direto no canvas**, desfazer e refazer, atalhos, autosave e aviso quando outra aba salvou antes.
- **Biblioteca de seções prontas**, modelos de página e seções salvas como modelo próprio.

### IA
- **Gerar seção**: descreva o que quer e escolha entre 3 variações, com preview real.
- **Criar página inteira**: a partir de um briefing, a IA sugere 3 identidades visuais (cores e fontes), monta a estrutura e escreve todas as seções em paralelo.
- **Editar com IA** (`⌘I`): reescreve textos, ajusta estilos ou refaz uma seção inteira. Tudo desfaz com um `Ctrl+Z`.

### Publicação e marketing
- **Publicação em HTML estático**, gerado pelas mesmas views do editor. As páginas carregam rápido e não precisam de React no navegador.
- **Tema do site**: cores, fontes, logo, cabeçalho e rodapé compartilhados entre as páginas.
- **Leads e visitas**: formulários salvam contatos (com UTMs), e há métricas de acesso por página.
- **SEO e rastreamento**: título, descrição, imagem de compartilhamento, sitemap, pixels (Meta, Google, TikTok) e aviso de cookies (LGPD).

---

## Stack

| Camada | Tecnologia |
|---|---|
| App (front + back) | [TanStack Start](https://tanstack.com/start) · React 19 · Vite · server functions |
| Editor | [Craft.js](https://craft.js.org) · Tiptap · CodeMirror |
| Interface | Tailwind CSS v4 · shadcn/ui · lucide |
| Estado e dados | Zustand · TanStack Query |
| Banco | PostgreSQL · [Drizzle ORM](https://orm.drizzle.team) |
| Autenticação | [Better Auth](https://better-auth.com) |
| Arquivos | S3 compatível (MinIO no ambiente local) |
| IA | [AI SDK](https://ai-sdk.dev) · OpenAI (Structured Outputs) |
| Qualidade | TypeScript · Biome |

---

## Como rodar

**Pré-requisitos:** Node 22+, [pnpm](https://pnpm.io) e Docker.

```bash
# 1. banco e storage
docker compose up -d postgres minio
docker compose run --rm minio-setup      # cria o bucket (só na primeira vez)

# 2. variáveis de ambiente
cp .env.example .env.local               # depois preencha os valores abaixo

# 3. dependências, banco e servidor
pnpm install
pnpm db:migrate
pnpm dev                                 # http://localhost:3100
```

Depois é só criar uma conta em `/signup`.

<details>
<summary><b>Variáveis de ambiente</b></summary>

| Variável | Obrigatória | Descrição |
|---|:---:|---|
| `DATABASE_URL` | Sim | Conexão do Postgres (o `.env.example` já aponta para o Docker) |
| `BETTER_AUTH_SECRET` | Sim | Segredo da sessão. Gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Sim | Endereço do app (`http://localhost:3100`) |
| `S3_*` | Sim | Storage de arquivos (o `.env.example` já aponta para o MinIO) |
| `OPENAI_API_KEY` | Não | Liga os recursos de IA. Sem ela, o resto funciona normalmente |
| `OPENAI_MODEL_FAST` / `OPENAI_MODEL_SMART` | Não | Troca os modelos usados (padrão: `gpt-5.4-mini` e `gpt-5.5`) |
| `AI_DAILY_LIMIT` | Não | Gerações por usuário a cada 24h (padrão: 150) |

</details>

<details>
<summary><b>Serviços locais (Docker)</b></summary>

| Serviço | Endereço | Usuário / senha |
|---|---|---|
| Postgres | `localhost:5440` | `builder` / `builder` |
| MinIO (API) | `localhost:9100` | `builder` / `builder-secret` |
| MinIO (console) | `localhost:9101` | `builder` / `builder-secret` |

</details>

### Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm db:generate` | Gera uma migração a partir do schema |
| `pnpm db:migrate` | Aplica as migrações |
| `pnpm db:studio` | Abre o Drizzle Studio |
| `pnpm check` | Lint e formatação (Biome) |

---

## Arquitetura

```
src/
├── builder/
│   ├── components/   um arquivo por componente: props, view, CSS e painel
│   ├── core/         motor de estilos, valores responsivos, árvore de nós
│   ├── editor/       canvas, painéis, autosave, atalhos
│   ├── renderer/     árvore de nós → HTML publicado
│   ├── runtime/      JS leve da página publicada (modal, carrossel, formulário…)
│   ├── templates/    seções e páginas prontas
│   └── ai/           linguagem da IA, compilador e prompts
├── server/           server functions (projetos, páginas, IA, arquivos)
├── routes/           telas, editor, páginas públicas e APIs
└── db/schema/        tabelas (Drizzle)
```

**Ideias principais**

- **Uma view por componente.** A mesma view React renderiza no editor e na página publicada, então o que você vê é o que vai ao ar.
- **Página por seções.** Cada seção é salva separadamente, o que permite reaproveitar cabeçalho, rodapé e modelos.
- **Publicar é gerar HTML.** O HTML fica pronto no momento da publicação, e cada visita só recebe o arquivo já montado.
- **A IA não escreve código.** Ela descreve a seção numa linguagem simples de blocos e tokens de design, e um compilador transforma isso em componentes do editor. Assim, o resultado sempre segue o tema, é responsivo e continua editável.

```
pedido do usuário ──► OpenAI (JSON validado) ──► compilador ──► componentes do editor
```

<details>
<summary><b>Adicionando um componente</b></summary>

1. Crie `src/builder/components/<nome>.tsx` exportando um `ComponentDefinition` (use `button.tsx` como exemplo).
2. Registre em `src/builder/registry.ts`.
3. Adicione na barra lateral (`src/builder/editor/toolbox.tsx`), se ele for arrastável.
4. Se precisar de JS na página publicada, crie `runtime/features/<feature>.ts` e registre em `runtime/index.ts`.

</details>
