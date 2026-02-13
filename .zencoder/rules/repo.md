---
description: Repository Information Overview
alwaysApply: true
---

# Virgil St. Information

## Summary
**Virgil St.** is a full-stack application designed to provide resource management, AI-assisted case management, and community support for vulnerable populations. It features a resource library, a RAG-based chat assistant (Virgil AI), mapping services, a community forum, and specialized legal and treatment workflows.

## Structure
- [./client/](./client/): React frontend built with Vite and Tailwind CSS.
- [./server/](./server/): Express backend using tRPC for type-safe API communication.
- [./shared/](./shared/): Shared TypeScript types and constants used by both client and server.
- [./drizzle/](./drizzle/): Database schema definitions and migration files.
- [./knowledge_files/](./knowledge_files/): Source documents (PDF, Markdown, Text) used to populate the AI knowledge base.
- [./scripts/](./scripts/): Utility scripts for data ingestion and maintenance.

## Language & Runtime
**Language**: TypeScript  
**Version**: Node.js 20+  
**Build System**: Vite (frontend), esbuild (backend)  
**Package Manager**: pnpm 10+

## Dependencies
**Main Dependencies**:
- **Frontend**: `react` (v19), `@tanstack/react-query`, `tailwindcss`, `wouter`, `@trpc/client`, `@radix-ui/react-*` components.
- **Backend**: `express`, `@trpc/server`, `drizzle-orm`, `mysql2`, `openai`, `pdf-parse`.
- **AI/RAG**: `GPT-4o` (OpenAI), `SerpAPI` (Google Search), `embeddings` for semantic search.

**Development Dependencies**:
- `vitest`, `typescript`, `tsx`, `drizzle-kit`, `esbuild`, `prettier`.

## Build & Installation
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Generate and apply database migrations
pnpm run db:push

# Index the knowledge base for Virgil AI (Required)
pnpm run index-knowledge

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run production build
pnpm start
```

## Docker

**Configuration**: [./docker-compose.yml](./docker-compose.yml)
**Services**: Provides a `mysql:8.4` container for local development.
- **Host**: `127.0.0.1:3306`
- **Database**: `virgil_st`
- **User/Password**: `root`/`root`

## Main Files & Resources
- **Server Entry**: [./server/_core/index.ts](./server/_core/index.ts)
- **Vite Config**: [./vite.config.ts](./vite.config.ts)
- **Database Schema**: [./drizzle/schema.ts](./drizzle/schema.ts)
- **API Routers**: [./server/routers.ts](./server/routers.ts)
- **Knowledge Base**: [./knowledge_files/](./knowledge_files/) (80+ documents)

## Testing

**Framework**: Vitest
**Test Location**: [./server/](./server/)
**Naming Convention**: `*.test.ts`
**Configuration**: [./vitest.config.ts](./vitest.config.ts)

**Run Command**:
```bash
pnpm test
```
