import { Pinecone, type RecordMetadata } from "@pinecone-database/pinecone";

import { EMBEDDING_DIMENSION } from "./gemini";

const apiKey = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX ?? "resume-screening";

let client: Pinecone | null = null;
let indexEnsured = false;

function getClient(): Pinecone {
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
  if (!client) client = new Pinecone({ apiKey });
  return client;
}

async function ensureIndex() {
  if (indexEnsured) return;
  const pc = getClient();
  const { indexes } = await pc.listIndexes();
  const exists = indexes?.some((i) => i.name === INDEX_NAME);
  if (!exists) {
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
      waitUntilReady: true,
    });
  }
  indexEnsured = true;
}

export async function upsertCandidateVector(
  id: string,
  values: number[],
  metadata: RecordMetadata,
) {
  await ensureIndex();
  const index = getClient().index(INDEX_NAME);
  await index.upsert([{ id, values, metadata }]);
}

export async function queryByVector(
  userId: string,
  vector: number[],
  topK: number,
): Promise<{ id: string; score: number }[]> {
  await ensureIndex();
  const index = getClient().index(INDEX_NAME);
  const res = await index.query({
    vector,
    topK,
    filter: { userId: { $eq: userId } },
    includeMetadata: false,
  });
  return (res.matches ?? []).map((m) => ({ id: m.id, score: m.score ?? 0 }));
}

export async function deleteCandidateVector(id: string) {
  if (!apiKey) return;
  try {
    await ensureIndex();
    await getClient().index(INDEX_NAME).deleteOne(id);
  } catch (err) {
    console.error("Pinecone delete failed:", err);
  }
}
