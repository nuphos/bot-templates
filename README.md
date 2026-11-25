# Nuphos Bot templates

Ready-made Bots for [Nuphos](https://nuphos.ai). Each template is a Bot with its instructions, a first message and optional routines. You add it to your team in one click and change anything you like afterwards.

The templates here are the source for the template catalog on nuphos.ai and the template picker in the Nuphos app.

## Templates

| Template | Bot | What it does |
| --- | --- | --- |
| [`nuphos-guide`](templates/nuphos-guide) | Nubie the First | Your first Bot. It shows you around Nuphos, helps you connect your tools and sets up the Bots you need. |

## Use a template

The template picker in the Nuphos app and the catalog on nuphos.ai are coming soon. Until then, the files here show exactly what each template imports.

Templates never turn anything on for you. Routines are imported switched off, and a template only lists the integrations it can use, with the reason for each.

## Layout

```
templates/<id>/
  manifest.json   The Bot itself, in the Nuphos bot bundle format
  template.json   How the catalog shows it: author, category, avatar, summary, examples
scripts/
  validate.mjs    Checks every template (run with `node scripts/validate.mjs`)
```

`manifest.json` holds what gets imported:

- `source.templateId` matches the folder name, and `source.version` is a semantic version you bump on every change
- `requirements` lists the integrations the Bot uses, whether each is required, and why
- `bots` holds exactly one Bot with its `name`, `instructions`, `greeting` and `schedules`

`template.json` holds what the catalog shows and is never imported.

## Contribute

New templates and improvements are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before you open a pull request.

## License

[Apache License 2.0](LICENSE)
