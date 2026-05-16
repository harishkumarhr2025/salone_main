import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const SALON_COLLECTIONS = [
  "customers",
  "salonservices",
  "salonbookings",
  "salonregistrations",
  "monthlyrevenueimports",
  "counters",
];

const INDEX_OPTION_KEYS = [
  "name",
  "unique",
  "sparse",
  "expireAfterSeconds",
  "partialFilterExpression",
  "collation",
  "weights",
  "default_language",
  "language_override",
  "textIndexVersion",
  "2dsphereIndexVersion",
  "bits",
  "min",
  "max",
  "bucketSize",
  "wildcardProjection",
  "hidden",
];

const pickIndexOptions = (indexSpec) => {
  const options = {};
  for (const key of INDEX_OPTION_KEYS) {
    if (typeof indexSpec[key] !== "undefined") {
      options[key] = indexSpec[key];
    }
  }
  return options;
};

const withDbName = (mongoUrl, dbName) => {
  const parsed = new URL(mongoUrl);
  parsed.pathname = `/${dbName}`;
  return parsed.toString();
};

const migrateCollection = async (sourceDb, targetDb, collectionName) => {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);

  const sourceCollections = await sourceDb
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (sourceCollections.length === 0) {
    console.log(`Skipping ${collectionName}: not found in source DB`);
    return;
  }

  const targetCollections = await targetDb
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();
  if (targetCollections.length === 0) {
    await targetDb.createCollection(collectionName);
  }

  const documents = await sourceCollection.find({}).toArray();
  if (documents.length > 0) {
    const ops = documents.map((document) => ({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true,
      },
    }));
    await targetCollection.bulkWrite(ops, { ordered: false });
  }

  const sourceIndexes = await sourceCollection.indexes();
  for (const indexSpec of sourceIndexes) {
    if (indexSpec.name === "_id_") {
      continue;
    }
    await targetCollection.createIndex(indexSpec.key, pickIndexOptions(indexSpec));
  }

  const targetCount = await targetCollection.estimatedDocumentCount();
  console.log(`Migrated ${collectionName}: ${targetCount} documents`);
};

const run = async () => {
  const mongoUrl = process.env.MONGO_URL_PROD || process.env.MONGO_URI;
  const sourceDbName = process.env.SALON_SOURCE_DB || "test";
  const targetDbName = process.env.SALON_DB_NAME || "salon";

  if (!mongoUrl) {
    throw new Error("MONGO_URL_PROD or MONGO_URI is missing in environment variables");
  }

  const sourceUrl = withDbName(mongoUrl, sourceDbName);
  const targetUrl = withDbName(mongoUrl, targetDbName);

  const sourceConn = await mongoose.createConnection(sourceUrl).asPromise();
  const targetConn = await mongoose.createConnection(targetUrl).asPromise();

  try {
    for (const collectionName of SALON_COLLECTIONS) {
      await migrateCollection(sourceConn.db, targetConn.db, collectionName);
    }
    console.log(`Salon migration completed: ${sourceDbName} -> ${targetDbName}`);
  } finally {
    await sourceConn.close();
    await targetConn.close();
  }
};

run().catch((error) => {
  console.error("Salon migration failed:", error.message);
  process.exit(1);
});
