# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
```bash
# Install dependencies
pnpm install

# Generate routes and start development
pnpm run dev

# Build for production
pnpm run build

# Preview production build locally
pnpm run preview

# Deploy to Cloudflare Workers
pnpm run deploy
```

### Route Management
```bash
# Generate route index from worker/ directory
pnpm run build-routes
```

### Package Management
- Use `pnpm` as the package manager (not npm or yarn)
- Project uses pnpm workspaces and node polyfills for browser compatibility

## Project Architecture

This is a **Cloudflare Workers** project with a **Vue 3 + PrimeVue** frontend that compiles to static assets served by the worker.

### Core Architecture Layers

1. **Frontend (Vue 3 SPA)**
   - Built with Vite, uses Vue 3 Composition API
   - UI components from PrimeVue 4.x with auto-import
   - File-based routing with `unplugin-vue-router`
   - Auto-imports for Vue composables and components

2. **Backend (Cloudflare Workers API)**
   - Custom router system in `lib/router.mjs`
   - API handlers in `worker/` directory
   - Supports both function-based and class-based handlers (ClassView pattern)
   - Auto-generated route index via `scripts/build-routes.mjs`

3. **Data Layer**
   - Custom ORM-like system in `lib/model/` directory
   - Database abstraction with migration support (`lib/model/migrate.mjs`)
   - Query builder and validation utilities

### Key Directory Structure

- `src/` - Vue frontend application
- `worker/` - Cloudflare Workers API handlers  
- `lib/` - Shared utilities and core systems
  - `lib/model/` - Database models and ORM functionality
  - `lib/router.mjs` - Custom routing system
  - `lib/classview.mjs` - Class-based view pattern
- `components/` - Global Vue components
- `composables/` - Vue composition functions
- `scripts/build-routes.mjs` - Dynamic route generation

### Route Generation System

The project uses automatic route generation:
- API routes are scanned from `worker/` directory
- Routes support both function exports and ClassView classes
- ClassView classes are automatically wrapped with dispatch logic
- Route index is generated at `worker/index.mjs`

### ClassView Pattern

API handlers can extend `ClassView` for structured request handling:
- Supports method-based routing (GET, POST, etc.)
- Built-in request/response handling
- Automatic instantiation and dispatch

### Build Process

1. `predev`/`prebuild` hooks run `build-routes` to scan API files
2. Vite builds the frontend with extensive plugin configuration:
   - Node.js polyfills for browser compatibility
   - Auto-import for Vue/PrimeVue components
   - File-based routing generation
   - TypeScript support with auto-generated types
3. Static assets are output to `dist/` for Cloudflare Workers

### Environment Configuration

- Uses `dotenv` with expansion for environment variables
- Wrangler configuration in `wrangler.jsonc`
- Environment variables exposed to frontend via Vite define
- SPA mode configured for client-side routing

### Development Workflow

1. Routes are automatically generated from `worker/` directory structure
2. Frontend uses file-based routing from `src/views/`
3. Both frontend and backend support hot reloading in development
4. Production build creates optimized static assets served by the worker

### Package Management Notes

- Project uses pnpm for faster installs and better disk efficiency
- Node polyfills enabled for browser compatibility with Node.js modules
- TypeScript configured with strict settings and auto-generated type definitions