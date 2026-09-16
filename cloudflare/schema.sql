CREATE TABLE IF NOT EXISTS chat (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  content TEXT NOT NULL,
  media_type TEXT,
  media_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  content TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_url TEXT,
  created_at TEXT NOT NULL
);
