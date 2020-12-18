/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Copyright (c) 2018 Zach Leatherman
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const { DateTime } = require("luxon");
const { promisify } = require("util");
const fs = require("fs");
const exec = promisify(require("child_process").exec);
const hasha = require("hasha");
const readFile = promisify(require("fs").readFile);
const yaml = require("js-yaml");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const localImages = require("./third_party/eleventy-plugin-local-images/.eleventy.js");
const CleanCSS = require("clean-css");
const mjml2html = require("mjml");
const GA_ID = require("./_data/metadata.json").googleAnalyticsId;
const podcastPlayer = require("./_11ty/podcastPlayer");

const Liquid = require("liquidjs");
const engine = new Liquid();
const layoutPath = "_includes/layouts/email_html.mjml.liquid";
const emailTemplateLiquid = fs.readFileSync(layoutPath, "utf8");
const emailTemplate = engine.parse(emailTemplateLiquid);

module.exports = function (eleventyConfig) {
  ["yaml", "yml"].forEach((ext) => {
    eleventyConfig.addDataExtension(ext, (contents) => yaml.safeLoad(contents));
  });

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.addPlugin(localImages, {
    distPath: "_site",
    assetPath: "/img/remote",
    selector:
      "img,amp-img,amp-video,meta[property='og:image'],meta[name='twitter:image'],amp-story",
    verbose: false,
  });

  eleventyConfig.addPlugin(require("./_11ty/img-dim.js"));
  eleventyConfig.addPlugin(require("./_11ty/json-ld.js"));
  eleventyConfig.addPlugin(require("./_11ty/optimize-html.js"));
  eleventyConfig.addPlugin(require("./_11ty/csp.js"));
  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addNunjucksAsyncFilter(
    "addHash",
    function (absolutePath, callback) {
      readFile(`_site${absolutePath}`, {
        encoding: "utf-8",
      })
        .then((content) => {
          return hasha.async(content);
        })
        .then((hash) => {
          callback(null, `${absolutePath}?hash=${hash.substr(0, 10)}`);
        })
        .catch((error) => callback(error));
    }
  );

  eleventyConfig.addFilter("lastModifiedDate", function (filename) {
    const stats = fs.statSync(filename);
    return stats.mtime; // Date
  });

  eleventyConfig.addFilter("encodeURIComponent", function (str) {
    return encodeURIComponent(str);
  });

  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addNunjucksAsyncFilter("mjmlify", (emailIssue, cb) => {
    engine.render(emailTemplate, emailIssue.data).then((output) => {
      const html = mjml2html(output).html;
      cb(null, html);
    });
  });

  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("css");
  // We need to copy cached.js only if GA is used
  eleventyConfig.addPassthroughCopy(GA_ID ? "js" : "js/*[!cached].*");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("_headers");

  // We need to rebuild upon JS change to update the CSP.
  eleventyConfig.addWatchTarget("./js/");
  // We need to rebuild on CSS change to inline it.
  eleventyConfig.addWatchTarget("./css/");
  // Unfortunately this means .eleventyignore needs to be maintained redundantly.
  // But without this the JS build artefacts doesn't trigger a build.
  eleventyConfig.setUseGitIgnore(false);

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#",
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Browsersync Overrides
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync("_site/404.html");

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
  });

  // eleventyConfig.on("afterBuild", async () => {
  //   try {
  //     const { stdout, stderr } = await exec(
  //       "npx tailwindcss-cli@latest build src/tailwind.css -o ./_site/css/main.css"
  //     );
  //     // the *entire* stdout and stderr (buffered)
  //     console.log(`stdout: ${stdout}`);
  //     console.log(`stderr: ${stderr}`);
  //   } catch (err) {
  //     //some err occurred
  //     console.error(err);
  //   }
  // });

  eleventyConfig.addCollection("latestPodcast", function (collection) {
    let filtered = collection
      .getFilteredByTag("podcasts")
      .filter((item) => item.data.isPublished);
    filtered.reverse();
    return filtered[0];
  });

  eleventyConfig.addCollection("previousPodcast", function (collection) {
    let filtered = collection
      .getFilteredByTag("podcasts")
      .filter((item) => item.data.isPublished);

    if (filtered.length > 1) {
      filtered.reverse();
      return filtered[1];
    }

    return null;
  });

  eleventyConfig.addCollection("publishedPodcasts", function (collection) {
    let filtered = collection
      .getFilteredByTag("podcasts")
      .filter((item) => item.data.isPublished);
    filtered.reverse();
    return filtered;
  });

  eleventyConfig.addShortcode("podcastPlayer", podcastPlayer);

  return {
    templateFormats: ["md", "njk", "html", "liquid", "11ty.js"],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.io/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // These are all optional, defaults are shown:
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      // Warning hardcoded throughout repo. Find and replace is your friend :)
      output: "_site",
    },
  };
};
