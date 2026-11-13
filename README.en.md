# Inventor_mutationum

[日本語](README.md)

A browser tool for comparing primers with reference sequences and inspecting identity, mutation patterns and taxonomic distributions. Reference data and alignment code are embedded in the HTML, so a downloaded HTML file runs offline on its own.

**Current release: [v2.14.1](inventor_mutationum_2.14.1/inventor_mutationum_2.14.1.html)**

## Getting started

1. On your own PC, download this repository using **Code → Download ZIP**.
2. Extract the ZIP archive.
3. Open `inventor_mutationum_2.14.1/inventor_mutationum_2.14.1.html` in a browser. Google Chrome has been used for validation.

No Python installation or local server is required. Run the downloaded HTML file. The current HTML is approximately 82.5 MiB.

## Basic workflow

1. Enter Name, Forward and Reverse in the input table, or select template buttons below it. **Enter both Forward and Reverse in 5′→3′ orientation.** Either side can also be used alone.
2. Adjust region, minimum identity, coverage or parallelism under **高度なオプション** (Advanced options). The initial region is **all regions**.
3. Click **照合する** (Run alignment).
4. Filter taxa and choose the displayed primer under **結果** (Results). Taxonomic selection is retained when switching primers within the same region scope.
5. Switch chart ranks between phylum, class, order, family and genus. Click a pattern card to inspect its records, taxonomy and alignment.

Results starts expanded. **詳細** (Details) contains methods and reference scope. **出典一覧** (Sources) contains source descriptions, citations and the provenance of additional primers. **The bibliography is readable directly inside the HTML.**

Exports include CSV with Japanese labels or English keys, selected-region FASTA, and printing. Formula-like CSV values receive a leading apostrophe.

## Included data and settings

| Item | v2.14.1 |
| --- | --- |
| Regions | 16S, 12S, 18S and COI |
| Reference regions | 32,732 records |
| Phyla | Chordata, Mollusca, Arthropoda, Cnidaria, Annelida and Porifera |
| Japanese labels | 6,571 rank/scientific-name mappings |
| Templates | 15 buttons; the MiMammal bundle and individual buttons share the same three pairs |
| Simultaneous input | Up to 8 pairs / 16 Forward and Reverse primers combined |
| Primer length | 8–80 bases; DNA/IUPAC degeneracy supported |
| Parallelism | Automatic up to 8 workers, or manually 1, 2, 4 or 8 |
| Default thresholds | Identity ≥60%, coverage ≥80% |
| Result-call limit | 640,000 |

The included data are saved snapshots. Counts describe this selected reference panel, rather than all NCBI records or all biological species. Porifera includes annotated GenBank/RefSeq regions, including partial and predicted sequences.

## Primer templates

| Button | Region | Contents |
| --- | --- | --- |
| MiFish-U, MiFish-E, MiFish-U2, MiFish-M | 12S | One pair each |
| 16Sarbr | 16S | One pair |
| MiMammal（3組） | 12S | Add MiMammal-1, -2 and -3 together |
| MiMammal-1, MiMammal-2, MiMammal-3 | 12S | Add each pair individually |
| BirT | 12S | Added in v2.14.0 |
| uCeta | 12S | Added in v2.14.0; published as μCeta |
| Ceph16S-M | 16S | Added in v2.14.0; region follows the supplied primer name |
| V16S-U | 16S | Added in v2.14.0 |
| MiDeca | 16S | Added in v2.14.0 |
| Scle_12S | 12S | Added in v2.14.1; scleractinian corals |

All templates start unselected. Select multiple buttons to add rows; click a selected button again to remove its pair. MiMammal bundle/individual choices do not duplicate the same named pair. Combining 12S and 16S templates switches the region scope to all regions.

The five pairs added in v2.14.0 preserve the supplied Excel sequences, including all IUPAC bases. Original primer names, sheets, cells and region evidence are embedded in Sources. Ceph16S-M is explicitly marked as lacking a confirmed original publication for the exact supplied sequences.

Scle_12S was added from the supplied sequences, checked against Methods 2(b) in [Nishitsuji et al. (2023)](https://doi.org/10.1098/rspb.2023.0026). Forward: `CCAGCMGACGCGGTRANACTTA`; Reverse: `AAWTTGACGACGGCCATGC` (both 5′→3′). Original primer names and the full citation are embedded in Sources.

## Interpreting results

- **Green cards:** every record in the card is a perfect match allowing primer degeneracy, with no mismatch or gap and no ambiguous target base. For example, primer R matches target A or G.
- **Bar charts:** compare perfect-match reference sequences with other sequences. In subordinate-taxon mode, a group is counted on the perfect-match side when it contains at least one perfect-match reference.
- **Indeterminate target N:** N in the selected target alignment is treated as unknown and separated from ordinary patterns. Primer-side N remains a degenerate base.
- **Counting units:** reference records, taxa and mutation patterns are different units. A taxon may occur in several patterns, so genus counts from individual cards cannot simply be summed.

Forward and Reverse are aligned independently against references; the tool does not assess whether their relative positions form an amplicon. P/T rows are displayed in a common comparison orientation; the T row is not the opposing strand in order-ready 5′→3′ orientation. Computational matching and experimental amplification, PCR efficiency and Tm require separate evaluation.

## Data sources

Reference sequences and scientific names/taxonomy originate from [NCBI RefSeq/GenBank](https://www.ncbi.nlm.nih.gov/nuccore/) and [NCBI Taxonomy](https://www.ncbi.nlm.nih.gov/taxonomy). Confirmed Japanese labels are preserved, with missing entries supplemented from these sources:

| Japanese-name source | Adopted rank/name mappings |
| --- | ---: |
| [BISMaL](https://www.godac.jamstec.go.jp/bismal/j/) names with individual citations verified through [WoRMS](https://www.marinespecies.org/) | 3,411 |
| National Museum of Nature and Science: [Institute for Nature Study](https://ins.kahaku.go.jp/database/insdb/), [FishPix](https://fishpix.kahaku.go.jp/fishimage/), [Integrated Database](https://db.kahaku.go.jp/webmuseum/) | 1,052 |
| [DBCLS scientific/Japanese-name correspondence](https://togodb.biosciencedbc.jp/togodb/view/species_names_latin_vs_japanese) | 1,069 |
| [Standard Japanese Names of World Mammals, 2021](https://www.mammalogy.jp/list/index.html) | 869 |
| [List of Japan’s all fish species, Online ver.43](https://www.museum.kagoshima-u.ac.jp/staff/motomura/jaf.html) | 76 |
| [Standard Japanese Names of Amphibians and Reptiles of Japan](https://herpetology.jp/wamei/index_j.php) | 77 |
| [A Check List of Japanese Spiders, ver.2026 R3](https://www.asahi-net.or.jp/~dp7a-tnkw/japan.pdf) | 15 |
| [Japanese woodlouse species list](https://www.warajimushi.com/Species/List_species.html) | 2 |
| **Total** | **6,571** |

The [UJSSB checklist portal](https://www.ujssb.org/checklist/index.html) was used to locate primary sources. WoRMS is a retrieval and citation-verification route for BISMaL names, not an additional independent count. Unresolved entries display scientific names. Sources includes editions, roles and acquisition status, including examined sources that supplied no adopted names.

Mammal-list citation, preserved in its supplied form:

> 川田伸一郎・岩佐真宏・福井　大・新宅勇太・天野雅男・下稲葉さやか・樽　創・姉崎智子・鈴木　聡・押田龍夫・横畑泰志.　2021.　世界哺乳類標準和名リスト２０２１年度版.URL：https://www.mammalogy.jp/list/index.html

## Archived versions and release history

`main` contains the current release HTML and Japanese/English READMEs. Browse [version tags](https://github.com/Sacabambaeus/inventor_mutationum/tags) for earlier releases. Links to older versions below are pinned to their corresponding tags.

| Version | Main additions and fixes |
| --- | --- |
| [2.14.1](inventor_mutationum_2.14.1/inventor_mutationum_2.14.1.html) | Add Scle_12S, one pair/two primers, with bilingual embedded citation |
| [2.14.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.14.0/inventor_mutationum_2.14.0/inventor_mutationum_2.14.0.html) | Add BirT, uCeta, Ceph16S-M, V16S-U and MiDeca: 5 pairs / 10 primers |
| [2.13.1](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.13.1/inventor_mutationum_2.13.1/inventor_mutationum_2.13.1.html) | Embed a bilingual standalone Sources panel |
| [2.13.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.13.0/inventor_mutationum_2.13.0/inventor_mutationum_2.13.0.html) | Supplement 1,039 Japanese names from checklists and mammal Excel, reaching 6,571 |
| [2.12.1](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.12.1/inventor_mutationum_2.12.1/inventor_mutationum_2.12.1.html) | Supplement 1,069 missing species labels from DBCLS |
| [2.12.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.12.0/inventor_mutationum_2.12.0/inventor_mutationum_2.12.0.html) | Adopt NMNS/BISMaL Japanese-name authorities with individual evidence |
| [2.11.2](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.11.2/inventor_mutationum_2.11.2/inventor_mutationum_2.11.2.html) | Separate taxonomy and displayed-primer controls |
| [2.11.1](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.11.1/inventor_mutationum_2.11.1/inventor_mutationum_2.11.1.html) | Multiple template selection, individual removal and manual-input retention |
| [2.11.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.11.0/inventor_mutationum_2.11.0/inventor_mutationum_2.11.0.html) | Raise alignment capacity and add 3 MiMammal pairs |
| [2.10.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.10.0/inventor_mutationum_2.10.0/inventor_mutationum_2.10.0.html) | Parallel computation using up to 8 workers |
| [2.9.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.9.0/inventor_mutationum_2.9.0/inventor_mutationum_2.9.0.html) | Default to all regions and an expanded Results panel |
| [2.8.1](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.8.1/inventor_mutationum_2.8.1/inventor_mutationum_2.8.1.html) | Retain selected taxa across primer changes and reruns |
| [2.8.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.8.0/inventor_mutationum_2.8.0/inventor_mutationum_2.8.0.html) | Advanced options, paired input table, GBIF names and Details |
| [2.7.2](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.7.2/inventor_mutationum_2.7.2/inventor_mutationum_2.7.2.html) | Simplify charts to perfect-match versus other categories |
| [2.7.1](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.7.1/inventor_mutationum_2.7.1/inventor_mutationum_2.7.1.html) | Simplify matching and threshold explanations |
| [2.7.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.7.0/inventor_mutationum_2.7.0/inventor_mutationum_2.7.0.html) | Green perfect-match cards and taxonomic horizontal bar charts |
| [2.6.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.6.0/inventor_mutationum_2.6.0/inventor_mutationum_2.6.0.html) | Expand Porifera to 9,595 regions, total 32,732 |
| [2.5.1](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.5.1/inventor_mutationum_2.5.1/inventor_mutationum_2.5.1.html) | Integrate Porifera into standard taxonomy and built-in alignment |
| [2.5.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.5.0/inventor_mutationum_2.5.0/inventor_mutationum_2.5.0.html) | Add 143 Porifera references |
| [2.4.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.4.0/inventor_mutationum_2.4.0/inventor_mutationum_2.4.0.html) | CSV formula protection, input bounds, aggregation and import-race fixes |
| [2.3.0](https://github.com/Sacabambaeus/inventor_mutationum/blob/v2.3.0/inventor_mutationum_2.3.0.html) | Existing baseline release |

## Validation record

Saved v2.14.1 validation passed 24 browser checks and 18 integrity checks. The additional two primers completed 65,464 calls across all 32,732 references. This is computational validation, not a guarantee of experimental amplification.

## Repository contents

`main` tracks only three files: the current v2.14.1 HTML and the Japanese/English READMEs. Earlier versions are retained through tags and commit history. Original Excel workbooks, companion datasets, build source, validation artifacts and conversation logs are outside this distribution. The current HTML directly displays source descriptions and additional-primer provenance.

Calculation and file reading take place inside the browser. Following an external source link navigates to the respective website.
