import { MongoClient } from "mongodb";

let client;
let db;

export default async function handler(req, res) {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db("yourdbname");
  }

  if (req.method === "GET") {
    const visitors = await db.collection("visitors").findOne({});
    res.status(200).json(visitors || { count: 0 });
  } else if (req.method === "POST") {
    const visitors = await db.collection("visitors").findOne({});
    let count = visitors ? visitors.count + 1 : 1;
    await db.collection("visitors").updateOne({}, { $set: { count } }, { upsert: true });
    res.status(200).json({ count });
  }
}
