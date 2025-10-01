# EOL Scanner

## USAGE

```bash
node ./src/index.js <path_csv> [month] [exclude] [split]

Scan EOL dependency

Positionals:
  path_csv  Path to Yamory export csv file

Options:
  --version       Show version number                                       [boolean]
  --month         EOL detection if over this value (in month)  [number] [default: 12]
  --exclude       List url paths that forcing to check manually               [array]
  --hide-exclude  Hide all exclude dependencies            [boolean] [default: false]
  --split         Split file eol.csv by team-repository    [boolean] [default: false]
  --help          Show help                                                 [boolean]
```

## EXAMPLE

- `node ./src/index.js ./input/export.csv` ➡ normal
- `node ./src/index.js ./input/export.csv --month 24` ➡ custom EOL detection
- `node ./src/index.js ./input/export.csv --exclude com.kintone.lib1 com.kintone.lib2` ➡ add more url paths to exclude
- `node ./src/index.js ./input/export.csv --hide-exclude` ➡ hide all exclude dependencies
- `node ./src/index.js ./input/export.csv --split` ➡ split file eol.csv by {team_repository>project group}
