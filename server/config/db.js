const { MongoClient } = require('mongodb');

const dbName = 'shopmate';

let db;

const connectDB = async () => {
  if (db) return db;

  const uri = process.env.MONGO_URI;

  // ── Guard: verify MONGO_URI is set ──
  if (!uri) {
    console.error('[MongoDB] MONGO_URI is not defined in environment variables.');
    console.error('[MongoDB] Ensure your .env file exists in the server directory and contains MONGO_URI=<connection_string>');
    throw new Error('MONGO_URI is not defined');
  }

  // Mask the URI for safe logging (show host only)
  let maskedHost = 'unknown';
  try {
    const parsed = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
    maskedHost = parsed.hostname;
  } catch (_) { /* ignore parse errors */ }

  console.log(`[MongoDB] Attempting connection to ${maskedHost}...`);

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    console.log('[MongoDB] Connected successfully.');
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error(`[MongoDB] Connection failed.`);
    console.error(`[MongoDB] Host: ${maskedHost}`);
    console.error(`[MongoDB] Error name: ${error.name}`);
    console.error(`[MongoDB] Error message: ${error.message}`);
    if (error.code) console.error(`[MongoDB] Error code: ${error.code}`);
    if (error.cause) {
      console.error(`[MongoDB] Cause: ${error.cause.message || error.cause}`);
      if (error.cause.code) console.error(`[MongoDB] Cause code: ${error.cause.code}`);
    }

    // TLS-specific guidance
    const errStr = (error.message || '') + (error.cause?.message || '');
    if (errStr.includes('SSL') || errStr.includes('TLS') || errStr.includes('tls')) {
      console.error(`[MongoDB] Possible causes:`);
      console.error(`  - Your public IP may not be whitelisted in MongoDB Atlas → Security → Network Access`);
      console.error(`  - ISP, firewall, antivirus, or router may be interfering with TLS traffic on port 27017`);
      console.error(`  - A corporate/school network proxy may be intercepting non-HTTPS TLS connections`);
      console.error(`  - MongoDB Atlas cluster may be temporarily unavailable`);
    }
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

module.exports = { connectDB, getDB };
