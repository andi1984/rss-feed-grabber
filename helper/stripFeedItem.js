const _ = require("lodash");
const stripFeedItem = (feedItem) =>
  _.pick(feedItem, ["guid", "title", "link", "pubDate"]);

module.exports = stripFeedItem;
