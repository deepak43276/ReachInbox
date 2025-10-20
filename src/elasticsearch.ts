import { Client } from "@elastic/elasticsearch";

const esclient = new Client({ node: "http://localhost:9200" });
const INDEX_NAME = "emails";

export async function initIndex() {
  const exists = await esclient.indices.exists({ index: INDEX_NAME });

  if (!exists) {
    await esclient.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          subject: { type: "text" },
          body: { type: "text" },
          accountId: { type: "keyword" },
          folder: { type: "keyword" },
          date: { type: "date" },
          aiCategory: { type: "keyword" },
        },
      },
    });
  }
}

export async function indexEmail(email: any) {
  await esclient.index({
    index: INDEX_NAME,
    document: email,
  });
}

export async function searchEmails(query: string) {
  const { hits } = await esclient.search({
    index: INDEX_NAME,
    query: {
      bool: {
        must: query ? [{ match: { body: query } }] : [],
        filter: [],
      },
    },
  });
  return hits.hits.map((hit) => hit._source);
}
