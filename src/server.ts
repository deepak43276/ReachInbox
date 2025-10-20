import express from "express";
import { initIndex, indexEmail, searchEmails } from "./elasticsearch";

const app = express();
app.use(express.json());

initIndex().then(() => console.log("Elasticsearch index ready"));

app.post("/emails", async (req, res) => {
  await indexEmail(req.body);
  res.send({ status: "ok" });
});

app.get("/emails", async (req, res) => {
  const q = (req.query.q as string) || "";
  const results = await searchEmails(q); // single argument now
  res.send(results);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
