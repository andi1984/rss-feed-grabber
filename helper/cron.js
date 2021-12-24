require("dotenv").config();
const _ = require("lodash");
const { v4: uuidv4 } = require('uuid');

const createClient = require("@supabase/supabase-js").createClient;

const getFeed = require("./getFeed");
const stripFeedItem = require("./stripFeedItem");

const runCronJob = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_API_PUBLIC
  );

  const tableName = process.env.SUPABASE_TABLE_NAME;
  // 1. Get current RSS feed
  const rssData = await getFeed();

  // 1b Strip out data we don't need
  const strippedData = rssData.items
    .filter((item) => item.categories.includes("andi1984-news"))
    .map(stripFeedItem)
    .map((item) => ({
      id: uuidv4(),
      ..._.pick(item, ["title"]),
      url: item.link,
      source: item.guid,
      date: new Date(item.pubDate).toISOString(),
    }));

  // 2. Filter out feed items hat are already in the DB

  // Get overlapping IDs that are already in the DB
  const allSources = strippedData.map((entry) => entry.source);
  const {
    data: overlappingSourcesDbResult,
    error: overlappingQueryError,
  } = await supabase.from(tableName).select("source").in("source", allSources);

  if (overlappingQueryError) {
    throw new Error(overlappingQueryError.message);
  }

  const overlappingSources = overlappingSourcesDbResult.map((entry) => entry.source);

  const newData = strippedData.filter((item) => {
    return !overlappingSources.includes(item.source);
  });

  if (newData.length === 0) {
    console.log("return empty list");
    return [];
  }

  console.log("AFTER EMPTY");

  // 3. INSERT new items into the DB
  const { data: insertedItems, error: insertionError } = await supabase
    .from(tableName)
    .insert(newData);

  if (insertionError) {
    throw new Error(insertionError.message);
  }

  console.log(`Inserted ${insertedItems.length} items to the DB.`);
  return insertedItems;
};

module.exports = runCronJob;
