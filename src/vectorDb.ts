import { QdrantClient } from "@qdrant/qdrant-client";

const client = new QdrantClient({ url: "http://localhost:6333" });
const COLLECTION = "product-context";

export async function initQdrant() {
  const exists = await client.getCollections()
    .then(res => res.collections.some(c => c.name === COLLECTION))
    .catch(() => false);

  if (!exists) {
    await client.createCollection(COLLECTION, {
      vectors: { size: 512, distance: "Cosine" }
    });
  }
}

export async function storeProductContext(
  textChunks: string[],
  embeddingFn: (s: string) => Promise<number[]>
) {
  await initQdrant();

  const points = await Promise.all(
    textChunks.map(async (chunk, i) => ({
      id: Date.now() + i,
      vector: await embeddingFn(chunk),
      payload: { text: chunk }
    }))
  );

  await client.upsert(COLLECTION, { points });
}

export async function searchContext(queryEmbedding: number[], k = 3) {
  await initQdrant();

  const res = await client.search(COLLECTION, {
    vector: queryEmbedding,
    limit: k,
    with_payload: true
  });

  return res.map(r => r.payload?.text || "");
}
