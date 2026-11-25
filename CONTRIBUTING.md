# Contributing a Bot template

Thanks for sharing a Bot. A good template does one job well, works the moment it is imported, and never surprises the person who adds it.

## Before you start

Search the [open and closed pull requests](https://github.com/nuphos/bot-templates/pulls?q=is%3Apr) first. If a similar template exists, improve it instead of adding a near copy.

One pull request adds or changes one template.

## Add a template

1. Copy an existing folder in `templates/` to `templates/<your-id>/`. The id is kebab-case, such as `support-triage`.
2. Edit `manifest.json`:
   - set `source.templateId` to your folder name and `source.version` to `1.0.0`
   - give the Bot a short, friendly `name` (it is a teammate, not a feature)
   - write `instructions` in plain language: what the Bot does, how it answers, and what it must not do
   - write a `greeting`, the first message the Bot posts after it is added. Say who it is, what it can do, and end with a question that gets the person started
   - add `schedules` only when the job is naturally recurring, with `requestedEnabled: false`
   - list every integration the Bot uses in `requirements`, with `required` and a one-line `reason`
3. Edit `template.json`:
   - `author.name` and `author.github` are you
   - `official` is `false`; only the Nuphos team marks a template official
   - `category` is one of `Getting started`, `Research`, `Writing`, `Marketing`, `Productivity`, `Learning`, `For developers`
   - `avatar` is one of the built-in avatars listed below
   - `summary` is one sentence of up to 140 characters
   - `highlights` and `examples` each have two to five lines
4. Run `node scripts/validate.mjs --write` (Node 20 or later), fix anything it reports, and commit the updated `catalog.json`.
5. Open a pull request and fill in the checklist.

To change an existing template, bump `source.version`: patch for wording, minor for new behavior or routines, major when it would surprise people who already use it.

## Rules

These are checked in review, and the validator enforces the ones it can.

- **No secrets.** Never put API keys, tokens, passwords, internal URLs or personal data in a template. A Bot gets access through the integrations a team connects, not through its instructions.
- **Nothing runs on import.** Routines ship switched off (`requestedEnabled: false`). The person turns them on.
- **Ask, don't assume.** Integrations go in `requirements` with an honest reason. Prefer optional integrations, and have the Bot still be useful without them.
- **No memories, files or chats.** A template is one Bot. Anything about a specific team belongs in that team's own Bot after import.
- **Stay in scope.** The instructions must not tell the Bot to take actions the person did not ask for, send data elsewhere, or bypass review.
- **Original work.** Do not copy another product's Bot, name, persona or wording. Contributions are licensed under the [Apache License 2.0](LICENSE).
- **English first.** Write the template in English. A Bot can still answer in whatever language the person writes in.

## Avatars

`01-vermeer-girl.svg`, `02-leonardo.svg`, `03-mona-lisa.svg`, `04-venus.svg`, `05-rembrandt.svg`, `06-beethoven.svg`, `07-ada.svg`, `08-socrates.svg`, `09-frida.svg`, `10-van-gogh.svg`, `11-mozart.svg`, `12-newton.svg`, `13-shakespeare.svg`, `14-napoleon.svg`, `15-cleopatra.svg`, `16-athena.svg`, `17-the-scream.svg`, `18-american-gothic.svg`, `19-the-fifer.svg`, `20-son-of-man.svg`, `21-the-milkmaid.svg`, `22-lady-with-an-ermine.svg`, `23-girl-with-peaches.svg`, `24-the-blue-boy.svg`, `25-infanta.svg`, `26-the-swing.svg`, `27-the-astronomer.svg`, `28-the-sleeping-gypsy.svg`, `29-amelia-earhart.svg`

## Review

A maintainer reads every template before it is merged: the instructions, the greeting, the routines and the requirements. We may suggest edits to wording or scope, or decline a template that overlaps an existing one or does not meet the rules. A merged template appears in the catalog with the next catalog update.

## Security

If you find a template that leaks data or could be misused, do not open a public issue. Report it privately through [GitHub security advisories](https://github.com/nuphos/bot-templates/security/advisories/new).
