import Database from 'better-sqlite3'

const db = new Database('park.db')
// 生产环境关键配置：WAL 模式提升并发读性能
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'inspector',  -- admin | inspector
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'other',      -- facility | environment | safety | other
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | done
    images TEXT DEFAULT '[]',                -- JSON 数组，存图片路径
    latitude REAL,
    longitude REAL,
    address TEXT,
    reporter_id INTEGER,
    handler_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id)
  );
`)

export default db