# My Blog Backend

Simple backend for a personal blog (Express + TypeScript + Prisma).

## Features

- REST endpoints for posts under `/posts` (see `src/routes/posts.ts`).
- Static file serving for uploaded markdown files at `/uploads`.
- Uses Prisma for a local SQLite database (`prisma/dev.db`).

## Prerequisites

- Node.js (16+ recommended)
- npm or yarn

## Install

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client (optional if already generated):

```bash
npm run prisma:generate
```

## Run

- Development (uses `ts-node-dev`):

```bash
npm run dev
```

- Build and run production:

```bash
npm run build
npm start
```

The server listens on `http://localhost:3000` by default (set `PORT` to change).

## API

- GET /posts — list posts
- GET /posts/:id — get a single post
- POST /posts — create a post (check `src/routes/posts.ts` for request shape)
- Static uploads are served at `/uploads` (files stored in the `uploads/` folder)

## Notes

- Database schema and migrations are in the `prisma/` folder.
- Uploaded markdown files are stored in the `uploads/` folder and served statically.

## License

ISC
