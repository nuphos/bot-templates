## Template

<!-- Which template does this add or change, and what job does the Bot do? -->

## Checklist

- [ ] One template per pull request
- [ ] `node scripts/validate.mjs` passes
- [ ] `source.version` is `1.0.0` for a new template, or bumped for a change
- [ ] No secrets, internal URLs or personal data
- [ ] Routines ship switched off (`requestedEnabled: false`)
- [ ] Every integration the Bot uses is listed in `requirements` with a reason
- [ ] The greeting says who the Bot is, what it can do, and asks a question to get started
- [ ] I tried the Bot in Nuphos and it works without extra setup beyond the listed integrations
