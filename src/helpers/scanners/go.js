import axios from "axios";

class GoScanner {
  /**
   *
   * @param {string} packageUrl
   */
  modifyRequestUrl(packageUrl) {
    return `${packageUrl}?tab=versions`;
  }

  /**
   *
   * @param {string} packageUrl
   * @return {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    const modifiedUrl = this.modifyRequestUrl(packageUrl);
    const resp = await axios.get(modifiedUrl);
    const allPublishVersions = [];
    const textResOneLine = resp.data.split(/\r?\n/).join("");
    const regexpPublishVersion = new RegExp(
      /<a class="js-versionLink".*?>v(.*?)<\/a>/g,
    );
    const matchesPublishVersion = textResOneLine.matchAll(regexpPublishVersion);
    for (const match of matchesPublishVersion) {
      allPublishVersions.push(match[1]);
    }

    const allPublishTS = [];
    const regexpPublishDate = new RegExp(
      "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ?( \\d{1,2}|), \\d{4}",
      "g",
    );
    const matchesPublishDate = textResOneLine.matchAll(regexpPublishDate);
    for (const match of matchesPublishDate) {
      allPublishTS.push(Date.parse(match[0]));
    }
    const lastPublishTS = Math.max.apply(null, allPublishTS);
    const lastPublishIndex = allPublishTS.indexOf(lastPublishTS);

    return {
      version: allPublishVersions[lastPublishIndex],
      date: new Date(allPublishTS[lastPublishIndex]).toString(),
    };
  }
}

export const goScanner = new GoScanner();
