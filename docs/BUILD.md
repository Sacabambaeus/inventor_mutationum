# ビルド手順

[English](BUILD.en.md)

## 必要な環境

- Python 3.9以降。ビルドは標準ライブラリだけで実行します。
- Node.js 22以降。JavaScriptの構文確認と照合テストに使用します。
- 操作確認用のブラウザ。

利用者が完成済みHTMLを開く場合、Python・Node.jsは不要です。

## 再生成と確認

```bash
python3 scripts/build.py
python3 scripts/build.py --check
node --check src/app.js
node --check src/sources.js
node --test tests/alignment.test.cjs
```

通常ビルドは`primatch.html`を生成します。`--check`はファイルを書き換えず、ソースから生成した内容と配布HTMLが完全に一致することを確認します。不一致なら終了コード1を返します。

別の場所へ生成する場合：

```bash
python3 scripts/build.py --output build/primatch.html
```

ビルドには外部APIや利用者のExcelを使用しません。リポジトリ内の参照スナップショットから、オフラインで再生成できます。

## 入力ファイル

| パス | 用途 |
| --- | --- |
| `src/page.html` | 画面・スタイル・出典本文。スクリプト挿入用のトークンを含む |
| `src/app.js` | 入力、テンプレート、ワーカー、集計、描画、出力 |
| `src/alignment.js` | IUPAC対応の照合と結果判定 |
| `src/sources.js` | 出典タブの開閉と言語切替 |
| `data/references.json.gz` | 参照配列、計算済み結果、既存プライマー |
| `data/names.json.gz` | 学名・和名対応と書誌情報 |
| `data/manifest.tsv` | 圧縮前後のSHA256、展開後サイズ、挿入先 |
| `index.html` | 公開入口。生成処理を通さず`primatch.html`へ案内する |

ビルドは参照データのチェックサムとJSONを確認し、各トークンを一度だけ置換します。JSONには文字`<`を直接入れず、`\u003c`へエスケープしてください。

## 自動チェック

GitHub ActionsはpushとPRで、再現ビルド・構文確認・照合テストを実行します。CIはPython 3.12とNode.js 24を使用し、参照配列の再取得は行いません。デスクトップ・モバイルの操作確認は、変更内容に応じてPRで報告してください。

## データの更新

`data/`のスナップショットは原資料の代わりではありません。更新時は原資料を保持し、出典・取得日・変換方法を記録したうえで、対応するmanifestのチェックサムとサイズを更新してください。配列や和名の採用基準はHTML内の「出典一覧」に記載されています。
