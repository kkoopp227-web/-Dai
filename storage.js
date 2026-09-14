const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_PATH = path.join(__dirname, 'data.json');

let mongoClient = null;
let collection = null;
let cache = {};

function loadJsonFile() {
  if (!fs.existsSync(DB_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (_) {
    return {};
  }
}

async function connectMongo() {
  mongoClient = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  await mongoClient.connect();
  collection = mongoClient.db().collection('server_settings');
}

async function loadAllFromMongo() {
  const docs = await collection.find({}).toArray();
  cache = {};
  for (const doc of docs) cache[doc._id] = doc.data || {};
}

async function seedFromJson() {
  const count = await collection.countDocuments();
  if (count > 0) return;

  const json = loadJsonFile();
  const entries = Object.entries(json);
  if (entries.length === 0) return;

  for (const [guildId, guildData] of entries) {
    await collection.updateOne({ _id: guildId }, { $set: { data: guildData || {} } }, { upsert: true });
  }
  console.log(`تم ترحيل إعدادات ${entries.length} سيرفر من data.json إلى MongoDB`);
}

async function init() {
  if (!config.mongoUri) {
    cache = loadJsonFile();
    console.log('التحزين المحلي (data.json) — أضف متغير MONGO_URI لتشغيل MongoDB');
    return;
  }

  try {
    await connectMongo();
    await seedFromJson();
    await loadAllFromMongo();
    console.log(`متصل بـ MongoDB — تم تحميل ${Object.keys(cache).length} سيرفر`);
  } catch (err) {
    console.error(`تعذر الاتصال بـ MongoDB (${err.message}) — التحول إلى data.json`);
    cache = loadJsonFile();
  }
}

function loadDB() {
  return cache;
}

async function saveDB(data) {
  if (!data) return;

  if (!collection) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    cache = data;
    return;
  }

  const keys = Object.keys(data);
  for (const guildId of keys) {
    await collection.updateOne({ _id: guildId }, { $set: { data: data[guildId] || {} } }, { upsert: true });
  }
  cache = data;
}

module.exports = { init, loadDB, saveDB };