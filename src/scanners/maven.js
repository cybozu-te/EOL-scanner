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
    const artifact = splitUrl[splitUrl.length - 2];
    const group = splitUrl[splitUrl.length - 3];
    return `https://search.maven.org/solrsearch/select?q=g:${group}+AND+a:${artifact}&core=gav&start=0&rows=1&wt=json`;
  }

  /**
   *
   * @param {string} packageUrl
   * @returns {Promise<{version: string, date: string}>}
   */
  async getLastPublish(packageUrl) {
    let lastPublish;
    try {
      const modifiedUrl = this.modifyRequestUrl(packageUrl);
      const jsonResponse = await axios.get(modifiedUrl);
      const jsonDocs = jsonResponse.data["response"]["docs"];
      lastPublish = {
        version: jsonDocs[0]["v"],
        date: new Date(jsonDocs[0]["timestamp"]).toString(),
      };
    } catch (error) {
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
            const _regex = `class="vbtn .*?">${versionMatched}<\\/a>.*?((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ?( \\d{1,2}|), \\d{4})<\\/`;
            allPublishDateRegex.push(_regex);
          }

          const allPublishInfo = [];
          for (let i = 0; i < allPublishDateRegex.length; i++) {
            regex = new RegExp(allPublishDateRegex[i]);
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

          lastPublish = {
            version: latestPublishInfo.version,
            date: latestPublishInfo.date.toString(),
          };
        } else {
          throw new Error(`STATUS CODE: ${httpRes.status()}`);
        }
      } catch (ex) {
        throw new Error(ex.message);
      } finally {
        await newPage.close();
        await newBrowser.close();
      }
    }

    return lastPublish;
  }
}

export const mavenScanner = new MavenScanner();
