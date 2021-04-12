require("dotenv").config();
const _ = require("lodash");

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
      ..._.pick(item, ["title"]),
      url: item.link,
      id: item.guid,
      date: new Date(item.pubDate).toISOString(),
    }));

  // 2. Filter out feed items hat are already in the DB

  // Get overlapping IDs that are already in the DB
  const allIds = strippedData.map((entry) => entry.id);
  const {
    data: overlappingIdsDbResult,
    error: overlappingQueryError,
  } = await supabase.from(tableName).select("id").in("id", allIds);

  if (overlappingQueryError) {
    throw new Error(overlappingQueryError.message);
  }

  const overlappingIds = overlappingIdsDbResult.map((entry) => entry.id);

  const newData = strippedData.filter((item) => {
    return !overlappingIds.includes(item.id);
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
