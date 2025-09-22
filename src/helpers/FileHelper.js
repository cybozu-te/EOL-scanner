import { SUPPORTED_TYPES, YAMORY_HEADER_JP } from "#resources/constants.js";

import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
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
 * @param {object} [headers] - If not provided, inferre from the keys of the first object in `rows`
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
    const packageType = row[YAMORY_HEADER_JP["package type"]];
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
