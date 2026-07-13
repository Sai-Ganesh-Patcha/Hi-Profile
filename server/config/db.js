const { MongoClient } = require('mongodb');

const dbName = 'hiprofile';

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

const setupIndexes = async () => {
  try {
    const database = getDB();
    
    // Users collection indexes
    await database.collection('users').createIndex({ username: 1 }, { unique: true });
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Username reservations collection unique index and TTL index (15 minutes)
    await database.collection('username_reservations').createIndex({ username: 1 }, { unique: true });
    // expiresAt is a Date field, expireAfterSeconds: 0 means it expires at expiresAt time
    await database.collection('username_reservations').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // Refresh tokens TTL index (30 days)
    await database.collection('refresh_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // Verification tokens TTL index (24 hours or 1 hour depending on document)
    await database.collection('verification_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    console.log('[MongoDB] All unique and TTL indexes verified/created successfully.');
  } catch (error) {
    console.error('[MongoDB] Index creation failed:', error);
  }
};

module.exports = { connectDB, getDB, setupIndexes };
