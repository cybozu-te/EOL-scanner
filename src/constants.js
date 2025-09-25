import path from "path";
import { fileURLToPath } from "url";

export const CONFIG_FILE_PATH = fileURLToPath(
  new URL("../config.json", import.meta.url),
);

export const SUPPORTED_TYPES = [
  "composer",
  "go",
  "maven",
  "npm",
  "nuget",
  "pypi",
  "rubygems",
];

export const CSV_DIR = {
  output: path.join(process.cwd(), "output"),
  manualSplit: path.join(
    process.cwd(),
    "output",
    "manual_splitBy_teamRepository",
  ),
  eolSplit: path.join(process.cwd(), "output", "eol_splitBy_teamRepository"),
  errorSplit: path.join(
    process.cwd(),
    "output",
    "error_splitBy_teamRepository",
  ),
};

export const CSV_PATH = {
  manual: path.join(CSV_DIR.output, "manual.csv"),
  eol: path.join(CSV_DIR.output, "eol.csv"),
  error: path.join(CSV_DIR.output, "error.csv"),
};

export const YAMORY_HEADER_JP = {
  "license risk": "ライセンスリスク",
  team: "チーム",
  "repository/project group": "リポジトリ/プロジェクトグループ",
  "manifest/project": "マニフェスト/プロジェクト",
  "package type": "パッケージタイプ",
  software: "ソフトウェア",
  license: "ライセンス",
  "includes license without OSI certification":
    "OSI 認定なしのライセンスを含む",
  "project site": "プロジェクトサイト",
  "source code repository": "ソースコードリポジトリ",
  "package repository": "パッケージリポジトリ",
};

export const EOL_HEADER_JP = {
  "last publish version": "最終公開バージョン",
  "last publish date": "最終公開日",
  "different in month": "経過月数",
  ...YAMORY_HEADER_JP,
};

export const YAMORY_HEADER_EN = Object.fromEntries(
  Object.entries(YAMORY_HEADER_JP).map(([key, value]) => [value, key]),
);

export const EOL_HEADER_EN = Object.fromEntries(
  Object.entries(EOL_HEADER_JP).map(([key, value]) => [value, key]),
);
