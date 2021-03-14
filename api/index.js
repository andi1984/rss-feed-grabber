require("dotenv").config();
const express = require("express");
const runCronJob = require("../helper/cron");
const { getItems } = require("../helper/db");

const app = express();
const port = 8080;

const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = undefined;

app.get("/api", async (req, res) => {
  // Access the provided 'page' and 'limt' query parameters
  const page = parseInt(req.query.p);
  const limit = parseInt(req.query.l);

  const results = await getItems(
    isNaN(limit) ? DEFAULT_LIMIT : limit,
    isNaN(page) ? DEFAULT_PAGE : page
  );

  /* TODO: Find a more "restricted" way for CORS to work */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(results);
});
app.get("/api/cron", async (req, res) => {
  const data = await runCronJob();
  return res.send(data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
