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


