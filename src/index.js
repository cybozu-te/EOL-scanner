import {
  CSV_DIR,
  CSV_PATH,
  EOL_HEADER_EN,
  YAMORY_HEADER_EN,
  YAMORY_HEADER_JP,
} from "#src/constants.js";
import {
  exportCsv,
  exportSplittedCsv,
  getDependenciesFromCsv,
  scanEOL,
} from "#src/helper.js";

import fs from "fs";
import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import configFile from "../config.json" with { type: "json" };

const argv = yargs(hideBin(process.argv))
  .command("$0 <path_csv> [month] [exclude] [split]", "Scan EOL dependency")
  .positional("path_csv", {
    demandOption: true,
    type: "string",
    describe: "Path file *.csv that exporting from Yamory",
  })
  .option("month", {
    type: "number",
    default: configFile.month,
    describe: "EOL detection if higher than it",
  })
  .option("exclude", {
    type: "array",
    default: [],
    coerce: (inputVal) => [...configFile.exclude, ...inputVal],
    describe: "List urls that forcing to check manually",
  })
  .option("hide-exclude", {
    type: "boolean",
    default: false,
    describe: "Hide all exclude dependencies",
  })
  .option("split", {
    type: "boolean",
    default: false,
    describe: "Split `eol.csv` by team-repository",
  })
  .help()
  .parseSync();

console.log("\n<=====-----* CHECKING *-----=====>");
(async () => {
  const start = new Date();
  const {
    path_csv: csvPath,
    month: monthThreshold,
    exclude: excludeUrlPaths,
    "hide-exclude": isHideExclude,
    split: isSplit,
  } = argv;
  const { depsPerType, manualDeps, totalRowCount } = getDependenciesFromCsv(
    csvPath,
    excludeUrlPaths,
    isHideExclude,
  );

  if (fs.existsSync(CSV_DIR.output)) {
    fs.rmSync(CSV_DIR.output, { recursive: true, force: true });
  }
  fs.mkdirSync(CSV_DIR.output);

  const eolPromises = [];
  let depCountTotal = 0;
  const depCountPerType = [];

  Object.entries(depsPerType).forEach(([packageType, csvRows]) => {
    eolPromises.push(scanEOL(packageType, csvRows, monthThreshold));

    const depsPerType = new Set(
      csvRows.map((row) => row[YAMORY_HEADER_JP["package repository"]]),
    );
    depCountTotal += depsPerType.size;
    depCountPerType.push(`${packageType}: ${depsPerType.size}`);
  });

  const results = await Promise.all(eolPromises);
  const eolRows = results.flatMap((result) => result.eolRows);
  const eolCount = new Set(
    eolRows.map((row) => row[YAMORY_HEADER_JP["package repository"]]),
  ).size;

  const errorRows = results.flatMap((result) => result.errorRows);
  const errorCount = new Set(
    errorRows.map((row) => row[YAMORY_HEADER_JP["package repository"]]),
  ).size;

  exportCsv(CSV_PATH.eol, eolRows, EOL_HEADER_EN);
  exportCsv(CSV_PATH.manual, manualDeps, YAMORY_HEADER_EN);
  exportCsv(CSV_PATH.error, errorRows, YAMORY_HEADER_EN);
  if (isSplit) {
    exportSplittedCsv(CSV_DIR.eolSplit, eolRows, EOL_HEADER_EN);
    exportSplittedCsv(CSV_DIR.manualSplit, manualDeps, YAMORY_HEADER_EN);
    exportSplittedCsv(CSV_DIR.errorSplit, errorRows, YAMORY_HEADER_EN);
  }

  console.log("\n<=====-----* COMPLETED *-----=====>");
  console.log("[INFO] Execute information");
  console.log(`>> EOL target: ⬆ ${monthThreshold} month(s) from today`);
  console.log(
    `>> Exclude dependencies' url path: ${excludeUrlPaths.join(",")}`,
  );
  console.log(
    `>> Duration: ${(new Date().getTime() - start.getTime()) / 1000} seconds`,
  );
  console.log(`[INFO] Total lines in Yamory CSV file: ${totalRowCount}`);
  console.log(`[INFO] Total lines checking by manual: ${manualDeps.length}`);
  console.log(
    `[INFO] Total checked dependencies WITHOUT duplicate: ${depCountTotal} (${depCountPerType.join(", ")})`,
  );
  console.log(`[INFO] Total EOL(s): ${eolCount}`);
  console.log(`[INFO] Total error(s): ${errorCount}`);
})();
