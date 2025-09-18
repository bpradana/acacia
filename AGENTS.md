# Repository Guidelines

## Project Structure & Module Organization
The repository currently holds the Electron entry point (`main.js`, to be added beside `package.json`), shared configs, and the `docs/` folder containing PRD, TRD, and UIDD references. Place renderer React code under `src/renderer/`, main-process modules under `src/main/`, and persisted session helpers under `src/common/`. Assets such as icons or preload scripts should
live in `assets/` and `src/preload/` so Electron packaging can locate them easily. Keep large design artefacts in `docs/` and update them when architectural changes land.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Launch the app locally via `npx electron .`; this expects a compiled renderer bundle in `dist/renderer` produced by your chosen build pipeline (e.g., Vite or webpack). When adding bundlers or linters, wire them into npm scripts (`npm run dev`, `npm run build`) and document any prerequisites in this guide. Until automation exists,
include manual steps in pull requests so other agents can repeat them.

## Coding Style & Naming Conventions
Use modern ES2023+ or TypeScript with strict type checking once configured. Follow a two-space indentation, single quotes for strings, and trailing commas where valid. React components should live in PascalCase files (`TabTree.tsx`), utility modules in camelCase (`sessionStore.ts`). Prefer pure functions and colocate styles next to components using CSS modules or styled-
components consistently. Add or update ESLint/Prettier rules in `configs/` and ensure they run before submitting changes.

## Testing Guidelines
Plan for Jest or Vitest unit tests under `tests/unit/` and renderer-focused tests alongside components in `__tests__/`. End-to-end Electron workflows should be covered with Spectron or Playwright in `tests/e2e/`. Name specs after the feature (`tab-tree.spec.ts`) and ensure `npm test` runs them without additional flags. Target meaningful coverage for state management and
tab lifecycle flows described in the TRD, and document any gaps in the PR notes.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat:`, `fix:`, `chore:`) so release tooling can infer history. Keep commits scoped to a single concern and include brief rationales. Pull requests must summarize the change set, link to relevant PRD/TRD sections, note manual validation steps, and attach screenshots or recordings for UI changes. Request review from at least one other agent
before merging even in fast-follow situations.
