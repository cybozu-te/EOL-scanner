import process from "process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
  .command("$0 <path_csv> [month] [exclude] [split]", "Check EOL dependency")
  .positional("path_csv", {
    demandOption: true,
    describe: "Path file *.csv that exporting from Yamory",
  })
  .option("month", {
    type: "number",
    default: 12,
    describe: "EOL detection if higher than it",
  })
  .option("exclude", {
    type: "array",
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
  .parse();
