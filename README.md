# YouBeenClassed — The Class Board

A Next.js 15 / React 19 competitive comedy playground. This upgrade adds a persistent, device-local game loop and a mobile clubhouse around the Class Board.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Validate with `npm test` and `npm run build`; use `npm start` to serve the production build.

## Seventeen new features

1. Autosaved drafts and recovery.
2. Roast remixes with original-author attribution.
3. Topic filters.
4. Fictional daily targets rotating at midnight UTC.
5. A 60-second Quickfire challenge with deadline checks.
6. Daily check-in streaks and capped practice-credit rewards.
7. Three daily quests with once-per-day reward claims.
8. Twelve earned achievements.
9. Eight player levels and XP progress.
10. A personal clubhouse at `/profile`.
11. A local activity inbox with unread tracking.
12. Reversible author mute controls.
13. Editing, archiving, and restoring your own posts.
14. Self-contained, attributed share links.
15. Four downloadable share-card themes.
16. Validated JSON progress backup and restore.
17. A searchable command palette and keyboard shortcuts.

Use **17 NEW WAYS TO PLAY** on the home page to open each feature.

## Source map

- `app/components`: interface, composer, dialogs, and clubhouse.
- `app/lib/board-state.mjs`: state transitions, save migration, validation, and backup handling.
- `app/lib/game-rules.mjs`: targets, levels, quests, achievements, and the feature catalog.
- `app/lib/*.test.mjs`: state and game-rule regression checks.
- `app/api/roast` and `app/api/classify`: optional server-side AI routes.

## Runtime boundaries

Progress is stored in browser local storage; the existing v2 save key is migrated to v3 automatically. Use backup export to carry progress to another device. Sample posts and rankings are labeled examples. This source does not provide public accounts, a shared multiplayer database, payments, or cash prizes.

The optional AI routes require a server-only `ANTHROPIC_API_KEY` environment variable and can incur provider charges when invoked. Keep it out of Git. Without it, the board, drafting, and game features still work. A static export does not run these server routes.

The current preview is a separate deployment. Publishing this repository does not change DNS or replace the original `youbeenclassed.org` deployment. Connect this repository to the intended hosting project when that account is available. Add authentication, shared persistence, moderation, and server-side abuse controls before using it as a public multiplayer service.
