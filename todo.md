# Review TODO

## P1

- [x] Fix optional form fields being submitted as empty strings.
  - Files: `app/submit/page.tsx`, `lib/validators/content.ts`
  - Problem: The single-submit form serializes `title`, `url`, `rawText`, `author`, and `note` even when they are empty strings. Zod optional fields still validate empty strings, so a user who only fills body text can get a 400 from `title: ""` or `url: ""`.
  - Suggested fix: Normalize empty strings to `undefined` before `fetch`, or preprocess empty strings in the validator.

- [x] Align Supabase Auth users with Prisma `User` records.
  - Files: `lib/auth.ts`, `prisma/schema.prisma`, `prisma/seed.ts`
  - Problem: `getCurrentUserId()` returns Supabase Auth `user.id`, but Prisma `User.id` defaults to `cuid()`. APIs use that id for reads and writes, so real logged-in users may not match local users and writes can fail.
  - Suggested fix: Use Supabase UUIDs as Prisma `User.id`, or upsert/map local users from Supabase auth identity before returning the application user id.

## P2

- [x] Make content library filters actually apply.
  - File: `app/library/page.tsx`
  - Problem: The page renders `recommendedAction`, `topic`, and `sortBy` controls, but the server query only uses platform, read status, and dates. Users can select filters that do not change results.
  - Suggested fix: Mirror the filtering logic from `/api/content` or share a query builder between page and API.

- [x] Sort by `readingValueScore`, not analysis count.
  - File: `app/api/content/route.ts`
  - Problem: `sortBy=readingValue` orders by `analyses._count`, which does not rank content by reading value. Most content has one current analysis, so ordering is effectively wrong.
  - Suggested fix: Query/sort by the current analysis `readingValueScore`, or fetch the page candidate set and sort by current analysis score intentionally.

- [x] Handle per-item persistence failures in batch creation.
  - File: `app/api/content/batch/route.ts`
  - Problem: Batch creation only handles validation failures. If `createContentItem` throws for one item, the whole request 500s and already-created successes are not clearly reported.
  - Suggested fix: Catch persistence errors per item and add them to `failures`, or make the endpoint explicitly transactional with all-or-nothing behavior.

- [x] Stop storing user notes in `ContentItem.summary`.
  - Files: `lib/repositories/content-repo.ts`, `prisma/schema.prisma`, `lib/types/content.ts`
  - Problem: `input.note` is written into `summary`, mixing user notes with AI/manual summaries and risking overwrite or semantic confusion.
  - Suggested fix: Add a dedicated `note` field to `ContentItem`, or rename/adjust the UI and data model so the field has one meaning.

- [x] Remove production build dependency on online Google Fonts.
  - File: `app/layout.tsx`
  - Problem: `next/font/google` downloads fonts at build time. `npm run build` fails when `fonts.googleapis.com` is unreachable.
  - Suggested fix: Use `next/font/local` with checked-in font assets, or ensure CI/deploy environments reliably access Google Fonts.

## P3

- [x] Set explicit Turbopack root.
  - File: `next.config.ts`
  - Problem: `next build` infers `/Users/minicoder` as the workspace root because multiple lockfiles exist, producing a warning and potentially broadening module resolution/watch scope.
  - Suggested fix: Read the local Next 16 Turbopack docs and set `turbopack.root` to this project directory.
