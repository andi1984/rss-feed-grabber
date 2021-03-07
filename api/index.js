require("dotenv").config();
const express = require("express");
const runCronJob = require("../helper/cron");

const app = express();
const port = 8080;

app.get("/api", (req, res) => {
  res.send("Hello world");
});
app.get("/api/cron", async (req, res) => {
  const data = await runCronJob();
  return res.send(data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
