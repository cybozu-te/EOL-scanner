import axios from "axios";

class ComposerScanner {
  /**
   *
   * @param {string} packageUrl
   */
  modifyRequestUrl(packageUrl) {
    const splitUrl = packageUrl.replace(/\/$/, "").split("/");
    const dependencyPackage = splitUrl[splitUrl.length - 1];
    const dependencyVendor = splitUrl[splitUrl.length - 2];
    return `https://repo.packagist.org/p2/${dependencyVendor}/${dependencyPackage}.json`;
  }

  /**
   *
   * @param {string} packageUrl
   * @returns {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    try {
      const modifiedUrl = this.modifyRequestUrl(packageUrl);
      const resp = await axios.get(modifiedUrl);
      const packages = resp.data["packages"];
      const allVersionInfo = packages[Object.keys(packages)[0]];
      const time = allVersionInfo[0]["time"];

      const devUrl = modifiedUrl.replace(".json", "~dev.json");
      const devResp = await axios.get(devUrl);
      const devPackages = devResp.data["packages"];
      const devAllVersionInfo = devPackages[Object.keys(packages)[0]];
      const devTime = devAllVersionInfo[0]["time"];
      if (Date.parse(devTime) >= Date.parse(time)) {
        return {
          version: devAllVersionInfo[0]["version"],
          date: devTime,
        };
      }
      return {
        version: allVersionInfo[0]["version"],
        date: time,
      };
    } catch (err) {
      if (err.response) {
        throw new Error(`Status Code: ${err.response.status}`);
      } else {
        throw new Error(err.message);
      }
    }
  }
}

export const composerScanner = new ComposerScanner();
