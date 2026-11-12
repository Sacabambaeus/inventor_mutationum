# Inventor_mutationum

[English](README.en.md)

プライマーと参照配列の一致率・変異パターンを、分類階層ごとに確認するブラウザツールです。配列データと照合処理をHTMLに収録しているため、ダウンロードしたHTML単体でオフライン実行できます。

**現行版：[v2.14.0](inventor_mutationum_2.14.0/inventor_mutationum_2.14.0.html)**

## 起動方法

1. 手元のPCのブラウザで、このリポジトリの **Code → Download ZIP** からファイルを取得します。
2. ZIPを展開します。
3. `inventor_mutationum_2.14.0`フォルダ内の`inventor_mutationum_2.14.0.html`をブラウザで開きます。Google Chromeで動作確認しています。

Pythonやサーバーの起動は不要です。実行するファイルはダウンロードしたHTMLです。現行HTMLのサイズは約82.5 MiBです。

## 基本操作

1. 名前・Forward・Reverseの表へプライマーを入力するか、表の下のテンプレートボタンを選びます。**Forward・Reverseとも5′→3′**で入力してください。片側だけでも使用できます。
2. 必要に応じて「高度なオプション」で対象領域・一致率・被覆率・並列数を変更します。対象領域の初期値は**全領域**です。
3. 「照合する」を押します。
4. 分類群を絞り込み、表示するプライマーを選んで「結果」を確認します。対象領域が同じ範囲では、プライマーを切り替えても分類群の選択を維持します。
5. 棒グラフの階層を門・綱・目・科・属へ切り替え、完全一致する参照の分布を確認します。パターンカードをクリックすると、該当記録・分類・整列を表示します。

「結果」は初期状態で展開されています。「詳細」には計算方法・参照範囲等を、「出典一覧」には情報源・引用・追加プライマーの原資料を収録しています。**出典本文はHTML内で直接閲覧できます。**

CSV（和名付き日本語／英語キー）、選択領域FASTA、印刷にも対応しています。CSVでは、数式と解釈され得る文字列の先頭へアポストロフィを付加します。

## 収録範囲と設定

| 項目 | v2.14.0の内容 |
| --- | --- |
| 対象領域 | 16S・12S・18S・COI |
| 参照領域数 | 32,732記録 |
| 収録する門 | 脊索動物・軟体動物・節足動物・刺胞動物・環形動物・海綿動物 |
| 和名対応数 | 6,571組（階級と学名の組） |
| テンプレート | 14ボタン。MiMammalの一括・個別ボタンは同じ3組を共有 |
| 同時入力 | 最大8組、Forward・Reverse合計16本 |
| プライマー長 | 8–80塩基、DNA/IUPAC縮重塩基に対応 |
| 並列計算 | 自動で最大8ワーカー、または1・2・4・8を指定 |
| 既定の計算条件 | 一致率60%以上、被覆率80%以上 |
| 結果件数の上限 | 640,000件 |

収録データは保存済みのスナップショットです。件数の対象はこの参照パネルで、NCBI全体の登録数や生物の全種数を表すものではありません。海綿動物には、部分配列・予測配列を含むGenBank／RefSeqの注釈領域を収録しています。

## プライマーテンプレート

| ボタン名 | 対象領域 | 内容 |
| --- | --- | --- |
| MiFish-U・MiFish-E・MiFish-U2・MiFish-M | 12S | 各1組 |
| 16Sarbr | 16S | 1組 |
| MiMammal（3組） | 12S | MiMammal-1・2・3を一括追加 |
| MiMammal-1・MiMammal-2・MiMammal-3 | 12S | 各組を個別追加 |
| BirT | 12S | v2.14.0で追加 |
| uCeta | 12S | v2.14.0で追加。文献上の名称はμCeta |
| Ceph16S-M | 16S | v2.14.0で追加。領域は利用者資料の名称に基づく設定 |
| V16S-U | 16S | v2.14.0で追加 |
| MiDeca | 16S | v2.14.0で追加 |

初期状態では、すべてのテンプレートが未選択です。複数ボタンを選ぶと行を追加し、同じボタンを再度押すとその組を解除します。MiMammalの一括・個別選択で同じ組を重複追加しません。12Sと16Sのテンプレートを組み合わせると、対象領域を全領域へ切り替えます。

v2.14.0で追加した5組の配列は、利用者提供のExcelから取得し、IUPAC縮重塩基を含めてそのまま登録しています。元のプライマー名・シート・セルと、対象領域の確認資料はHTML内の「出典一覧」で確認できます。Ceph16S-Mについては、同配列の原著文献が未確認であることも明記しています。

## 結果の読み方

- **緑色のカード**：そのカードの全記録が、プライマーの縮重塩基を許容した完全一致です。不一致・ギャップがなく、標的側に曖昧塩基がないものを対象とします。例えばプライマーのRは、標的のAまたはGと一致します。
- **棒グラフ**：完全一致する参照配列と、それ以外を比較します。下位分類群の数へ切り替えた場合は、完全一致する参照が1件以上ある分類群を数えます。
- **判定不能（標的N）**：選ばれた整列位置の標的Nは、不明な塩基として通常パターンと分離します。プライマー側のNは縮重塩基として扱います。
- **件数の単位**：参照記録数、分類群数、変異パターン数は異なります。同じ分類群が複数のパターンに含まれるため、カードごとの属数を単純に合計しないでください。

ForwardとReverseは、それぞれ独立して参照配列へ照合します。ペアの位置関係からアンプリコン成立を判定する機能は含みません。画面のP/Tは比較方向にそろえた表示で、T行は注文用の対向鎖5′→3′配列ではありません。計算上の一致と、実験での増幅・PCR効率・Tmは別に評価します。

## 情報源

参照配列と学名・分類階層は[NCBI RefSeq／GenBank](https://www.ncbi.nlm.nih.gov/nuccore/)および[NCBI Taxonomy](https://www.ncbi.nlm.nih.gov/taxonomy)に基づきます。和名は既存の確定名を保持し、空欄を次の資料で補完しています。

| 和名の情報源 | 採用数（階級・学名組） |
| --- | ---: |
| [BISMaL](https://www.godac.jamstec.go.jp/bismal/j/)由来・[WoRMS](https://www.marinespecies.org/)で個別出典確認 | 3,411 |
| 国立科学博物館：[自然教育園](https://ins.kahaku.go.jp/database/insdb/)・[FishPix](https://fishpix.kahaku.go.jp/fishimage/)・[統合DB](https://db.kahaku.go.jp/webmuseum/) | 1,052 |
| [DBCLS 学名と和名の対応](https://togodb.biosciencedbc.jp/togodb/view/species_names_latin_vs_japanese) | 1,069 |
| [世界哺乳類標準和名リスト2021年度版](https://www.mammalogy.jp/list/index.html) | 869 |
| [日本産魚類全種目録 Online ver.43](https://www.museum.kagoshima-u.ac.jp/staff/motomura/jaf.html) | 76 |
| [日本産爬虫両生類標準和名リスト](https://herpetology.jp/wamei/index_j.php) | 77 |
| [日本産クモ類目録 ver.2026 R3](https://www.asahi-net.or.jp/~dp7a-tnkw/japan.pdf) | 15 |
| [日本産ワラジムシ亜目種リスト](https://www.warajimushi.com/Species/List_species.html) | 2 |
| **合計** | **6,571** |

[日本分類学会連合のチェックリスト案内](https://www.ujssb.org/checklist/index.html)を原資料の発見に使用しました。WoRMSはBISMaL由来名の取得・出典確認の経路で、採用件数を重複計上していません。未確定の名称は学名で表示します。各資料の版・用途・取得状況と、確認したが採用に至らなかった資料は「出典一覧」に掲載しています。

哺乳類リストの引用：

> 川田伸一郎・岩佐真宏・福井　大・新宅勇太・天野雅男・下稲葉さやか・樽　創・姉崎智子・鈴木　聡・押田龍夫・横畑泰志.　2021.　世界哺乳類標準和名リスト２０２１年度版.URL：https://www.mammalogy.jp/list/index.html

## 版ごとの改善

| 版 | 主な追加・修正 |
| --- | --- |
| [2.14.0](inventor_mutationum_2.14.0/inventor_mutationum_2.14.0.html) | BirT・uCeta・Ceph16S-M・V16S-U・MiDecaの5組10本を追加 |
| [2.13.1](inventor_mutationum_2.13.1/inventor_mutationum_2.13.1.html) | 出典一覧をHTMLへ直接収録し、日本語・英語の単体閲覧に対応 |
| [2.13.0](inventor_mutationum_2.13.0/inventor_mutationum_2.13.0.html) | 各学会目録・哺乳類Excelで和名1,039組を補完、計6,571組 |
| [2.12.1](inventor_mutationum_2.12.1/inventor_mutationum_2.12.1.html) | DBCLSで未確定の種名1,069組を補完 |
| [2.12.0](inventor_mutationum_2.12.0/inventor_mutationum_2.12.0.html) | 和名の基準を科博・BISMaLへ変更し、個別の採用根拠を保存 |
| [2.11.2](inventor_mutationum_2.11.2/inventor_mutationum_2.11.2.html) | 分類群と表示プライマーを独立した操作枠へ分離 |
| [2.11.1](inventor_mutationum_2.11.1/inventor_mutationum_2.11.1.html) | 複数テンプレートの追加・個別解除・手入力保持 |
| [2.11.0](inventor_mutationum_2.11.0/inventor_mutationum_2.11.0.html) | 照合量上限を拡大し、MiMammal3組を追加 |
| [2.10.0](inventor_mutationum_2.10.0/inventor_mutationum_2.10.0.html) | 最大8ワーカーによる並列計算 |
| [2.9.0](inventor_mutationum_2.9.0/inventor_mutationum_2.9.0.html) | 全領域を初期選択し、初期展開の結果タブを追加 |
| [2.8.1](inventor_mutationum_2.8.1/inventor_mutationum_2.8.1.html) | プライマー切替・再計算時の分類群選択を保持 |
| [2.8.0](inventor_mutationum_2.8.0/inventor_mutationum_2.8.0.html) | 高度なオプション、表形式入力、GBIF和名、詳細パネル |
| [2.7.2](inventor_mutationum_2.7.2/inventor_mutationum_2.7.2.html) | 棒グラフを完全一致とそれ以外の2区分へ簡略化 |
| [2.7.1](inventor_mutationum_2.7.1/inventor_mutationum_2.7.1.html) | 一致・閾値の説明を平易な表現へ変更 |
| [2.7.0](inventor_mutationum_2.7.0/inventor_mutationum_2.7.0.html) | 完全一致カードの緑色化、分類階層別の横棒グラフ |
| [2.6.0](inventor_mutationum_2.6.0/inventor_mutationum_2.6.0.html) | 海綿動物参照を9,595領域へ拡充、全体32,732領域 |
| [2.5.1](inventor_mutationum_2.5.1/inventor_mutationum_2.5.1.html) | 海綿動物を通常の分類選択・共通の内蔵照合へ統合 |
| [2.5.0](inventor_mutationum_2.5.0/inventor_mutationum_2.5.0.html) | 海綿動物143参照を追加 |
| [2.4.0](inventor_mutationum_2.4.0/inventor_mutationum_2.4.0.html) | CSV数式対策、入力上限、大量集計・読込競合の修正 |
| [2.3.0](inventor_mutationum_2.3.0.html) | このリポジトリの基準となる既存版 |

## 検証記録

v2.14.0の保存済み検証では、ブラウザ76項目・整合性26項目が成功しています。追加10本を全32,732参照へ照合し、327,320件の計算完了を確認しました。これは実験での増幅性能の保証ではありません。

## このリポジトリの内容

追跡対象は、版別の配布用HTMLと日英READMEです。元Excel、別添データ、ビルド用ソース、検証成果物、会話ログは配布対象に含めていません。出典の本文と追加プライマーの原資料情報は、現行HTML内で閲覧できます。

計算・ファイル読込はブラウザ内で処理します。出典の外部リンクを開く操作では、リンク先のサイトへ移動します。
