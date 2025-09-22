import axios from "axios";

class PypiScanner {
  /**
   *
   * @param {string} packageUrl
   * @return {string}
   */
  modifyRequestUrl(packageUrl) {
    const splitUrl = packageUrl.replace(/\/$/, "").split("/");
    const name = splitUrl[splitUrl.length - 1];
    return `https://pypi.org/pypi/${name}/json`;
  }

  /**
   *
   * @param {string} packageUrl
   * @return {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    const modifiedUrl = this.modifyRequestUrl(packageUrl);
    const resp = await axios.get(modifiedUrl);
    const jsonResp = resp.data;
    return {
      version: jsonResp["info"]["version"],
      date: jsonResp["urls"][0]["upload_time"],
    };
  }
}

export const pypiScanner = new PypiScanner();
