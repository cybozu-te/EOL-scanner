import {
  EOL_HEADER_JP,
  SUPPORTED_TYPES,
  YAMORY_HEADER_JP,
} from "#src/constants.js";
import { composerScanner } from "#scanners/composer.js";
import { goScanner } from "#scanners/go.js";
import { mavenScanner } from "#scanners/maven.js";
import { npmScanner } from "#scanners/npm.js";
import { nugetScanner } from "#scanners/nuget.js";
import { pypiScanner } from "#scanners/pypi.js";
import { rubyGemsScanner } from "#scanners/rubygems.js";

import { parse, stringify } from "csv/sync";
import fs from "fs";
import path from "path";

/**
 *
 * @param {string} csvPath
 * @returns {object[]} - each object represents a row in the CSV
 */
function readCsv(csvPath) {
  try {
    const rawContent = fs.readFileSync(csvPath);
    const rows = parse(rawContent, {
      delimiter: ",",
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
    return rows;
  } catch (error) {
    throw new Error(`Failed to read CSV ${csvPath}: ${error.message}`);
  }
}

/**
 *
 * @param {string} filePath
 * @param {object[]} csvRows
 * @param {object} [headers] - If not provided, infer from the keys of the first object in `rows`
 */
export function exportCsv(filePath, csvRows, headers) {
  try {
    const csvContent = stringify(csvRows, {
      header: true,
      quoted: true,
      delimiter: ",",
      record_delimiter: "unix",
      columns: headers || undefined,
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, csvContent, { encoding: "utf8" });
  } catch (error) {
    throw new Error(`Failed to export CSV to ${filePath}: ${error.message}`);
  }
}

/**
 *
 * @param {string} outputDir
 * @param {object[]} csvRows
 * @param {object} headers
 */
export function exportSplittedCsv(outputDir, csvRows, headers) {
  const rowsPerGroup = {};

  for (const row of csvRows) {
    const packageType = row[YAMORY_HEADER_JP["package type"]].toLowerCase();
    const team = row[YAMORY_HEADER_JP.team];
    const repositoryGroup = row[YAMORY_HEADER_JP["repository/project group"]];
    let group = `${packageType}-${team}_${repositoryGroup}`;
    group = group.replace(/\//g, ">").replace(/"/g, "");

    if (!rowsPerGroup[group]) {
      rowsPerGroup[group] = [];
    }
    rowsPerGroup[group].push(row);
  }

  for (const [group, rows] of Object.entries(rowsPerGroup)) {
    const filePath = path.join(outputDir, `${group}.csv`);
    exportCsv(filePath, rows, headers);
  }
}

/**
 *
 * @param {string} csvPath
 * @param {string[]} excludeUrlPaths
 * @param {boolean} isHideExclude
 * @returns {{ depsPerType: Record<string, object[]> | {}, manualDeps: object[], totalRowCount: number }}
 */
export function getDependenciesFromCsv(
  csvPath,
  excludeUrlPaths,
  isHideExclude,
) {
  const depsPerType = {};
  const manualDeps = [];
  const csvRows = readCsv(csvPath);

  for (const csvRow of csvRows) {
    const packageType = csvRow[YAMORY_HEADER_JP["package type"]].toLowerCase();
    const packageUrl = csvRow[YAMORY_HEADER_JP["package repository"]];
    const isHttpUrl = packageUrl.startsWith("http");
    const isSupportedType = SUPPORTED_TYPES.includes(packageType);
    const isExcludedUrl = excludeUrlPaths.some((urlPath) =>
      packageUrl.includes(urlPath),
    );

    if (!isHttpUrl || !isSupportedType) {
      manualDeps.push(csvRow);
      continue;
    }
    if (isExcludedUrl) {
      if (!isHideExclude) manualDeps.push(csvRow);
      continue;
    }

    if (!depsPerType[packageType]) {
      depsPerType[packageType] = [];
    }
    depsPerType[packageType].push(csvRow);
  }

  return {
    depsPerType,
    manualDeps,
    totalRowCount: csvRows.length,
  };
}

/**
 *
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number}
 */
function calculateDifferentMonthBetween(date1, date2) {
  let months;
  months = (date2.getFullYear() - date1.getFullYear()) * 12;
  months -= date1.getMonth();
  months += date2.getMonth();
  return months <= 0 ? 0 : months;
}

/**
 *
 * @param {object[]} csvRows
 * @returns {{ packageUrl: object[] } | {}}
 */
function groupDepsPerUrl(csvRows) {
  const depsPerUrls = {};
  for (const row of csvRows) {
    const packageUrl = row[YAMORY_HEADER_JP["package repository"]];
    if (!depsPerUrls[packageUrl]) {
      depsPerUrls[packageUrl] = [];
    }
    depsPerUrls[packageUrl].push(row);
  }
  return depsPerUrls;
}

/**
 *
 * @param {string} packageType
 * @param {object[]} csvRows
 * @param {number} monthThreshold
 * @returns {Promise<{eolRows: object[], errorRows: object[]}>}
 */
export async function scanEOL(packageType, csvRows, monthThreshold) {
  const eolRows = [];
  const errorRows = [];
  const currentDate = new Date();
  const scanner = {
    composer: composerScanner,
    go: goScanner,
    maven: mavenScanner,
    npm: npmScanner,
    nuget: nugetScanner,
    pypi: pypiScanner,
    rubygems: rubyGemsScanner,
  }[packageType.toLowerCase()];

  const depsPerUrl = groupDepsPerUrl(csvRows);
  for (const [packageUrl, csvRows] of Object.entries(depsPerUrl)) {
    const modifiedUrl = scanner.modifyRequestUrl(packageUrl);

    try {
      const lastPublishData = await scanner.getLastPublish(packageUrl);
      const lastPublishDate = new Date(lastPublishData.date);
      const lastPublishDateISO = `${lastPublishDate.toISOString().split(".")[0]}Z`;
      const diffMonth = calculateDifferentMonthBetween(
        lastPublishDate,
        currentDate,
      );
      if (diffMonth > monthThreshold) {
        for (const csvRow of csvRows) {
          csvRow[EOL_HEADER_JP["last publish version"]] =
            lastPublishData.version;
          csvRow[EOL_HEADER_JP["last publish date"]] = ` ${lastPublishDateISO}`;
          csvRow[EOL_HEADER_JP["different in month"]] = diffMonth;
          eolRows.push(csvRow);
        }
        console.log(
          `❗ [${packageType}] ${packageUrl}\n ➜ Request URL: ${modifiedUrl}\n ➜ ${diffMonth} month(s) ago`,
        );
      } else {
        console.log(
          `✅ [${packageType}] ${packageUrl}\n ➜ Request URL: ${modifiedUrl}\n ➜ Last publish version: ${lastPublishData.version} - Last publish date: ${lastPublishDateISO}`,
        );
      }
    } catch (error) {
      const errorMsg = error.response
        ? `Status Code: ${error.response.status}`
        : error;
      console.log(
        `❌ [${packageType}] when scanning dependency url ${packageUrl}\n  >>> Request URL: ${modifiedUrl}\n  >>> ${errorMsg}`,
      );
      errorRows.push(...csvRows);
    }
  }

  return {
    eolRows,
    errorRows,
  };
}
