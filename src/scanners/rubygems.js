import axios from "axios";

class RubyGemsScanner {
  /**
   *
   * @param {string} packageUrl
   * @return {string}
   */
  modifyRequestUrl(packageUrl) {
    const splitUrl = packageUrl.replace(/\/$/, "").split("/");
    const name = splitUrl[splitUrl.length - 1];
    return `https://rubygems.org/api/v1/gems/${name}.json`;
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
      version: jsonResp["version"],
      date: jsonResp["version_created_at"],
    };
  }
}

export const rubyGemsScanner = new RubyGemsScanner();
