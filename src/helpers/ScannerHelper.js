import { EOL_HEADER_JP, YAMORY_HEADER_JP } from "#resources/constants.js";

import { composerScanner } from "#helpers/scanners/composer.js";
import { goScanner } from "#helpers/scanners/go.js";
import { mavenScanner } from "#helpers/scanners/maven.js";
import { npmScanner } from "#helpers/scanners/npm.js";
import { nugetScanner } from "#helpers/scanners/nuget.js";
import { pypiScanner } from "#helpers/scanners/pypi.js";
import { rubyGemsScanner } from "#helpers/scanners/rubygems.js";

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
        `❌ when scanning dependency url ${packageUrl}\n  >>> Request URL: ${modifiedUrl}\n  >>> ${errorMsg}`,
      );
      errorRows.push(...csvRows);
    }
  }

  return {
    eolRows,
    errorRows,
  };
}
