import axios from "axios";
import puppeteer from "puppeteer";

class MavenScanner {
  /**
   *
   * @param {number} timeInMs
   * @returns {Promise<void>}
   */
  async sleep(timeInMs) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeInMs);
    });
  }

  /**
   *
   * @param {string} packageUrl
   * @returns {string}
   */
  modifyRequestUrl(packageUrl) {
    const splitUrl = packageUrl.replace(/\/$/, "").split("/");
    const artifact = splitUrl[splitUrl.length - 1];
    const group = splitUrl[splitUrl.length - 2];
    return `https://search.maven.org/solrsearch/select?q=g:${group}+AND+a:${artifact}&core=gav&start=0&rows=1&wt=json`;
  }

  /**
   *
   * @param {string} packageUrl
   * @returns {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    const modifiedUrl = this.modifyRequestUrl(packageUrl);
    const jsonResponse = await axios.get(modifiedUrl);
    const jsonDocs = jsonResponse.data["response"]["docs"];
    if (jsonDocs.length > 0) {
      return {
        version: jsonDocs[0]["v"],
        date: new Date(jsonDocs[0]["timestamp"]).toString(),
      };
    } else {
      let errorMessage = "";
      const newBrowser = await puppeteer.launch();
      const newPage = await newBrowser.newPage();
      await newPage.setUserAgent({
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
      });
      try {
        // Go to mvn repository url and retry one time if not OK
        let httpRes = await newPage.goto(packageUrl, {
          waitUntil: "domcontentloaded",
        });
        if (!httpRes.ok()) {
          await this.sleep(1000);
          httpRes = await newPage.goto(packageUrl, {
            waitUntil: "domcontentloaded",
          });
        }

        if (httpRes.ok()) {
          const textRes = await httpRes.text();
          const textResOneLine = textRes.split(/\r?\n/).join("");
          let regex = new RegExp('class="vbtn .*?">(.*?)</a>', "g");
          const matches = textResOneLine.matchAll(regex);
          const allVersions = [];
          const allPublishDateRegex = [];
          for (const match of matches) {
            const versionMatched = match[1];
            allVersions.push(versionMatched);
            const _regex = `class="vbtn .*?">${versionMatched}<\\/a>.*?((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ?( \\d{1,2}|), \\d{4})<\\/span><\\/td><\\/tr>`;
            allPublishDateRegex.push(_regex);
          }

          const allPublishInfo = [];
          for (let i = 0; i < allPublishDateRegex.length; i++) {
            regex = new RegExp(allPublishDateRegex[i], "g");
            const _matches = textResOneLine.match(regex);
            const publishDate = _matches[1];
            allPublishInfo.push({
              version: allVersions[i],
              date: new Date(publishDate),
            });
          }
          const latestPublishInfo = allPublishInfo.sort(
            (objA, objB) => Number(objB.date) - Number(objA.date),
          )[0];

          return {
            version: latestPublishInfo.version,
            date: latestPublishInfo.date.toString(),
          };
        } else {
          // const textRes = await httpRes.text();
          // fs.writeFileSync(path.join(__dirname, 'error', packageUrl), textRes);
          errorMessage = `STATUS CODE: ${httpRes.status()}`;
        }
      } catch (ex) {
        errorMessage = ex.message;
      } finally {
        await newPage.close();
        await newBrowser.close();
      }
      throw errorMessage;
    }
  }
}

export const mavenScanner = new MavenScanner();
