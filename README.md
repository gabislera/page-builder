# Page Builder

Construtor de páginas drag-and-drop por seções. Front e back no mesmo projeto (TanStack Start + server functions), editor com Craft.js e publicação em HTML estático gerado pelas mesmas views React do editor.

## Stack

| Camada | Tecnologia |
|---|---|
| App (front + back) | TanStack Start (React 19, Vite, TanStack Router, server functions) |
| Editor drag-and-drop | @craftjs/core 0.2.12 |
| UI do editor | Tailwind CSS v4 + shadcn/ui (Radix) + lucide |
| Estado | Zustand (UI do editor) + TanStack Query (dados) |
| Texto rico / código | Tiptap 3 / CodeMirror 6 |
| Banco | PostgreSQL 17 + Drizzle ORM |
| Auth | Better Auth (e-mail e senha) |
| Arquivos | S3 compatível (MinIO local), upload direto por URL pré-assinada |
| Lint/format | Biome |

## Rodando local

```bash
docker compose up -d postgres minio
docker compose run --rm minio-setup   # cria o bucket "assets" (só na primeira vez)
cp .env.example .env.local            # gere BETTER_AUTH_SECRET: openssl rand -base64 32
pnpm install
pnpm db:migrate
pnpm dev                              # http://localhost:3100
```

- Postgres: `localhost:5440` (builder/builder)
- MinIO: API `localhost:9100`, console `localhost:9101` (builder/builder-secret)

## Arquitetura

```
src/
  builder/
    core/          motor de estilos, tipos responsivos, árvore (split/merge), craftify
    components/    um arquivo por componente: props, View, css, Settings
    controls/      controles do painel de configurações (shadcn)
    editor/        shell do editor, canvas em iframe, painéis, autosave, atalhos
    renderer/      JSON → HTML publicado (renderToStaticMarkup das mesmas Views)
    runtime/       JS vanilla da página publicada (modal, formulário, contador...)
    templates/     modelos de seção e de página
    registry.ts    catálogo de componentes (resolvedName → definição)
  server/          server functions (projetos, páginas, seções, assets)
  routes/          telas, editor, página pública /p/:projeto/:página, APIs
  db/schema/       tabelas Drizzle (auth + produto)
```

### Conceitos

- **Página por seções.** A raiz (`Page`) só aceita `Header`, `Section` e `Footer`. Cada filho da raiz é salvo como uma linha em `section`, com sua própria árvore de nós. A tabela `page_section` define a ordem.
- **Seções globais.** Uma seção com `is_global = true` é compartilhada por várias páginas. Editar em uma página altera todas; ao publicar, as páginas publicadas afetadas são republicadas.
- **Responsivo real.** Props responsivas são `{ desktop, tablet?, mobile? }` com cascata (mobile herda do tablet, que herda do desktop). O motor de estilos gera CSS com media queries (tablet ≤ 1024px, mobile ≤ 600px). O canvas é um iframe na largura do dispositivo, então o editor mostra exatamente o que vai ao ar.
- **Uma View por componente.** A mesma View React renderiza no editor e na publicação. Interatividade da página publicada vem de scripts vanilla em `runtime/`, incluídos só quando algum componente da página precisa.
- **Salvamento.** Autosave com debounce, rascunho local para recuperar trabalho e controle de versão otimista: se outra aba salvou antes, o editor avisa o conflito.
- **Server functions sem vazar o banco.** Funções que usam o `db` fora de um handler ficam em módulos próprios (ex.: `server/page-store.ts`); assim o compilador consegue tirar o driver do Postgres do bundle do navegador.

### Geração com IA

A IA não escreve props do Craft. Ela escreve **AI-Spec** (`builder/ai/spec.ts`): blocos (`Features`, `Pricing`, `Split`...), textos e tokens de design (tom da seção, tamanho do título). O compilador (`builder/ai/compile.ts`) transforma isso em `NodeSpec` com os mesmos helpers dos templates, então a seção gerada segue o tema, é responsiva e fica editável como qualquer outra.

- Servidor: `server/ai.ts` (server function) e `server/ai-store.ts` (modelo, limite diário, log em `ai_generation`).
- Editor: aba "Gerar com IA" na biblioteca de seções. São 3 variações em paralelo, com preview real.
- Configure `OPENAI_API_KEY` no `.env.local`. Modelos e limite são opcionais (veja `.env.example`).
- Um bloco novo no AI-Spec precisa de schema em `spec.ts`, de um `case` em `compile.ts` e, se ajudar, de uma menção nas regras de `prompt.ts`.

### Adicionando um componente

1. Crie `src/builder/components/<nome>.tsx` exportando um `ComponentDefinition` (veja `button.tsx`).
2. Registre em `src/builder/registry.ts`.
3. Adicione na Toolbox (`src/builder/editor/toolbox.tsx`) se for arrastável.
4. Se precisar de JS na página publicada, crie `runtime/features/<feature>.ts` e registre em `runtime/index.ts`.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | servidor de desenvolvimento na porta 3100 |
| `pnpm build` | build de produção (Nitro, Node) |
| `pnpm db:generate` | gera migração a partir do schema |
| `pnpm db:migrate` | aplica migrações |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm check` | Biome (lint + format) |
