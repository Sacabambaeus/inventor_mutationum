# Contributing

[日本語](CONTRIBUTING.md)

Bug reports, suggestions and pull requests for ぷらいまっち！- PriMatch are welcome.

## Reports and proposals

Choose a template in [Issues](https://github.com/Sacabambaeus/inventor_mutationum/issues). For a bug, include steps, expected behavior, actual behavior and browser details. Keep examples small and reproducible; exclude confidential sequences and personal information.

## Submitting changes

1. Fork the repository and create a working branch.
2. Edit the relevant source: `src/page.html` for markup, `src/app.js` for interaction, `src/alignment.js` for alignment, or `src/sources.js` for source-panel controls.
3. Rebuild the HTML and run the checks below.
4. Commit the changed source and generated `primatch.html`, then open a pull request.

```bash
python3 scripts/build.py
python3 scripts/build.py --check
node --check src/app.js
node --check src/sources.js
node --test tests/alignment.test.cjs
```

Open `index.html` in a browser and exercise the changed behavior. For visual changes, inspect desktop and narrow layouts; screenshots help reviewers.

## Repository conventions

- Keep the filename `primatch.html`. Do not increment release versions per commit or add version tags.
- Describe the change in the commit subject without a version prefix.
- Edit source files and regenerate `primatch.html` instead of editing generated HTML directly.
- Update both Japanese and English counterparts when changing documentation.
- Preserve original source materials. Record sources, retrieval dates and transformations for sequence/name changes; see [Data](data/README.en.md).
- The code license is currently unset. Describe the origin and usage conditions of contributed code/data in the PR.

## Alignment changes

Primer degeneracy and unknown target N have different meanings. Target N must not count as evidence of a perfect match. Distinguish reference records, taxa and mutation patterns, and calculate filtered aggregates from the same record cohort.

For a bug fix, add a check that fails if that bug recurs. See [Building](docs/BUILD.en.md).
