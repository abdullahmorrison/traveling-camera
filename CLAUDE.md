# traveling-camera

SvelteKit 3 (Svelte 5 runes) + TypeScript, adapter-node. Design source: Figma file `1QTjt5139SNn5lS3UOYRQX`, App page.

## Conventions

- Conventional commits; PR titles are conventional too (squash merged with the PR title).
- Small PRs, one concern each. CI (`ci` job) must be green before merge.
- Every behaviour change has a test: Vitest for logic in `src/**/*.spec.ts`, Playwright for flows in `e2e/*.e2e.ts`.
- Use npm 11 (`npx -y npm@11 install`); npm 10 crashes resolving this dependency tree.
- Imports use `#lib/...` (SvelteKit 3 subpath imports), not `$lib`.

## Product rules that shape the code

- Raw GPS never leaves the phone. The client sends H3 cells only; handoff cells are compared and discarded.
- A photo stores its neighbourhood (and coarse cell), never a precise point.
- No accounts. A device cookie identifies the holder.
- Holders get 7 days to pass the camera on, in person, or the chain ends.
