const XML_FEED =
  "https://www.inoreader.com/stream/user/1004829501/tag/user-favorites";

const Parser = require("rss-parser");

let parser = new Parser();

const getFeed = async () => {
  console.log("Parsing feed");
  return await parser.parseURL(XML_FEED);
};

module.exports = getFeed;
