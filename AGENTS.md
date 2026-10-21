# Agent notes

Read `GAME_CONCEPT.md` first: it is the implementation guide (rules, content contract, defaults).
Engine code (`src/engine`) must stay UI-free. Content and settings are data (`src/content`, `src/config`).
Label unfinished behaviour clearly. After changes run: `npm run validate:content && npm run test:engine && npm run build`.
