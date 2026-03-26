# my-blog-backend (TypeScript + Prisma)

Backend for a simple blog using Express, TypeScript and Prisma (SQLite).

Main routes:

- POST /posts (multipart/form-data) - fields: file (.md), title, publishedAt (ISO), tags (comma separated), readingTime, description, id (optional)
- GET /posts/:id - returns all post fields + markdown content
- GET /posts - returns list with id, title, publishedAt, tags, description

Quick start

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client and migrate (creates SQLite db)

```bash
npx prisma migrate dev --name init
npm run prisma:generate
```

3. Run in dev

```bash
npm run dev
```

# my-blog-backend

Servidor Express simples para gerenciar posts via upload de arquivo .md

Rotas principais:

- POST /posts
  - campos multipart/form-data:
    - file: arquivo .md (obrigatório)
    - title: string (obrigatório)
    - publishedAt: ISO date (opcional)
    - tags: string separado por vírgula ou array
    - readingTime: número
    - description: string
    - id: string (opcional)
  - retorna o post criado com `filePath` apontando para `/uploads/<filename>`

- GET /posts
  - retorna lista com: `id`, `title`, `publishedAt`, `tags`, `description`

- GET /posts/:id
  - retorna todas as infos do post e o conteúdo do .md em `content`

Como usar (local):

1. Instalar dependências

```bash
npm install
```

2. Iniciar servidor

```bash
npm start
```

Exemplo de upload com curl:

```bash
curl -X POST http://localhost:3000/posts \
  -F "file=@./example.md" \
  -F "title=Meu post" \
  -F "tags=tag1,tag2" \
  -F "readingTime=5" \
  -F "description=Descrição do post"
```
