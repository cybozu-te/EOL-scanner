class Dependency {
  /**
   *
   * @param {string} url
   * @param {string} urlRequest
   * @param {string[]} rawLines
   */
  constructor(url, urlRequest, rawLines) {
    this.url = url;
    this.urlRequest = urlRequest;
    this.rawLines = rawLines;
  }
}
