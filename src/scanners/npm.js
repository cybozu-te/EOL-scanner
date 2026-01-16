import axios from "axios";

class NpmScanner {
  /**
   *
   * @param {string} packageUrl
   * @returns {string}
   */
  modifyRequestUrl(packageUrl) {
    const splitUrl = packageUrl.replace(/\/$/, "").split("/");
    const name = splitUrl[splitUrl.length - 3];
    const group = splitUrl[splitUrl.length - 4];
    if (group.startsWith("@")) {
      return `https://registry.npmjs.org/${group}/${name}/latest`;
    } else {
      return `https://registry.npmjs.org/${name}/latest`;
    }
  }

  /**
   *
   * @param {string} packageUrl
   * @returns {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    const modifiedUrl = this.modifyRequestUrl(packageUrl);
    const resp = await axios.get(modifiedUrl);
    const jsonResp = resp.data;
    const lastPublishVersion = jsonResp["version"];
    if (Object.hasOwn(jsonResp, "_npmOperationalInternal")) {
      const tmpData = jsonResp["_npmOperationalInternal"]["tmp"];
      const lastPublishTS = tmpData.split("_").slice(-2)[0];
      return {
        version: lastPublishVersion,
        date: new Date(parseInt(lastPublishTS)).toString(),
      };
    } else {
      const resp = await axios.get(modifiedUrl.replace("/latest", ""));
      const objTimes = resp.data["time"];
      return {
        version: lastPublishVersion,
        date: objTimes[lastPublishVersion],
      };
    }
  }
}

export const npmScanner = new NpmScanner();
