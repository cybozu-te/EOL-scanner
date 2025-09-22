import axios from "axios";

class NugetScanner {
  /**
   *
   * @param {string} packageUrl
   */
  modifyRequestUrl(packageUrl) {
    const splitUrl = packageUrl.replace(/\/$/, "").split("/");
    // REF: https://docs.microsoft.com/en-us/nuget/api/search-query-service-resource
    const name = splitUrl[splitUrl.length - 1];

    // Update 08/2022: add 2 parameters
    // + prerelease=true: default is false --> it will exclude pre-release versions
    // + semVerLevel=2.0.0: https://github.com/NuGet/Home/wiki/SemVer2-support-for-nuget.org-%28server-side%29#identifying-semver-v200-packages
    return `https://azuresearch-usnc.nuget.org/query?q=${name}&prerelease=true&semVerLevel=2.0.0`;
  }

  /**
   *
   * @param {string} packageUrl
   * @returns {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    const modifiedUrl = this.modifyRequestUrl(packageUrl);
    const resp = await axios.get(modifiedUrl);
    const latestData = resp.data["data"][0];
    const idUrl = latestData["@id"];
    const version = latestData["version"];

    // REF: https://docs.microsoft.com/en-us/nuget/api/registration-base-url-resource#registration-page
    const resourceUrl = idUrl.replace("index", version);
    const resourceInfo = await axios.get(resourceUrl);

    return {
      version: version,
      date: resourceInfo.data["published"],
    };
  }
}

export const nugetScanner = new NugetScanner();
