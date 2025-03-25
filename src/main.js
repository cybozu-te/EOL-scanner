#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .command(
    "$0 <path_csv> [month] [exclude] [split]",
    "Check EOL dependency",
    (yargs) =>
      yargs
        .positional("path_csv", {
          demandOption: true,
          describe: "Path file *.csv that exporting from Yamory",
        })
        .option("month", {
          type: "number",
          describe: "EOL detection if higher than it",
        })
        .option("exclude", {
          type: "array",
          describe: "List url paths that forcing to check manually",
        })
        .option("hide-exclude", {
          type: "boolean",
          default: false,
          describe: "Hide all exclude dependencies",
        })
        .option("split", {
          type: "boolean",
          default: false,
          describe: "Split file eol.csv by team-repository",
        }),
  )
  .help().argv;
