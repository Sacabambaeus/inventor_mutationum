# Building

[日本語](BUILD.md)

## Requirements

- Python 3.9 or later. Building uses only the standard library.
- Node.js 22 or later for JavaScript syntax checks and alignment tests.
- A browser for interaction checks.

End users opening the completed HTML do not need Python or Node.js.

## Build and verify

```bash
python3 scripts/build.py
python3 scripts/build.py --check
node --check src/app.js
node --check src/sources.js
node --test tests/alignment.test.cjs
```

The default command writes `primatch.html`. `--check` writes nothing and verifies exact equality between source output and the distributable HTML; it exits with status 1 on a mismatch.

Line endings are pinned to LF by `.gitattributes`. If `--check` reports a mismatch in a Windows working copy cloned before that file was added, delete `primatch.html` and restore it with `git checkout -- primatch.html`.

To generate another output:

```bash
python3 scripts/build.py --output build/primatch.html
```

No external API or supplied Excel workbook is needed. The committed snapshots allow offline regeneration.

## Inputs

| Path | Purpose |
| --- | --- |
| `src/page.html` | Markup, styles and source text, including insertion tokens |
| `src/app.js` | Input, templates, workers, aggregation, rendering and exports |
| `src/alignment.js` | IUPAC alignment and result classification |
| `src/sources.js` | Source-panel and language controls |
| `data/references.json.gz` | Reference sequences, precomputed results and existing primers |
| `data/names.json.gz` | Scientific/Japanese-name mappings and bibliography |
| `data/manifest.tsv` | Compressed/decoded SHA256, decoded size and insertion target |
| `index.html` | Public entry pointing to `primatch.html`; not generated |

The builder verifies data checksums and JSON, then replaces each token exactly once. Encode literal `<` in JSON as `\u003c` before embedding.

## Automated checks

GitHub Actions runs build reproducibility, JavaScript syntax checks and alignment tests on pushes and PRs. CI uses Python 3.12 and Node.js 24 without retrieving live references. Report relevant desktop/mobile interaction checks in the PR.

## Updating data

Snapshots in `data/` are not substitutes for original source materials. Preserve originals and record sources, retrieval dates and transformations, then update manifest checksums and sizes. The embedded Sources panel describes sequence/name adoption criteria.
