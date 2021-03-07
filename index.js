require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const _ = require("lodash");

const createClient = require("@supabase/supabase-js").createClient;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_PUBLIC
);

const getFeed = require("./helper/getFeed");
const stripFeedItem = require("./helper/stripFeedItem");

const app = express();
const port = 3000;

const tableName = process.env.SUPABASE_TABLE_NAME;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const cronJob = async () => {
  console.log("running a task every minute");
  // 1. Get current RSS feed
  const rssData = await getFeed();

  // 1b Strip out data we don't need
  const strippedData = rssData.items.map(stripFeedItem).map((item) => ({
    ..._.pick(item, ["title"]),
    url: item.link,
    id: item.guid,
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
    return;
  }

  // 3. INSERT new items into the DB
  const { data: insertedItems, error: insertionError } = await supabase
    .from(tableName)
    .insert(newData);

  if (insertionError) {
    throw new Error(insertionError.message);
  }

  console.log(`Inserted ${insertedItems.length} items to the DB.`);
};

// Run every 30 minutes
cron.schedule("* * * * *", cronJob);
