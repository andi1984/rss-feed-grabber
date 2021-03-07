const _ = require("lodash");
const stripFeedItem = (feedItem) => _.pick(feedItem, ["guid", "title", "link"]);

module.exports = stripFeedItem;
