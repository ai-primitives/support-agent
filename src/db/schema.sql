-- Business profiles
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSON,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Customer personas
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  config JSON,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Knowledge base entries
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  content TEXT NOT NULL,
  metadata JSON,
  embedding_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  persona_id TEXT REFERENCES personas(id),
  channel TEXT NOT NULL,
  metadata JSON,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSON,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
