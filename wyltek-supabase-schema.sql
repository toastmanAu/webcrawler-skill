-- Wyltek Industries — Supabase schema
-- Paste this into: https://supabase.com/dashboard/project/yhntwgjzrzyhyxpiqcts/sql/new

-- ─────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  ckb_address   TEXT PRIMARY KEY,          -- CKB address = unique identity (from JoyID)
  name          TEXT NOT NULL,
  tagline       TEXT,
  avatar_url    TEXT,                       -- Supabase Storage URL for JPEG avatar
  x_handle      TEXT,
  telegram      TEXT,
  reddit        TEXT,
  discord       TEXT,
  wechat        TEXT,
  nostr_npub    TEXT,
  nervostalk    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (true);

-- Only owner can insert their own profile
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only owner can update their own profile  
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');


-- ─────────────────────────────────────────
-- 2. COMMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  TEXT NOT NULL CHECK (content_type IN ('blog', 'research')),
  content_id    TEXT NOT NULL,             -- post id or research task id
  ckb_address   TEXT NOT NULL REFERENCES profiles(ckb_address) ON DELETE CASCADE,
  body          TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "comments_read" ON comments
  FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only owner can update their own comment
CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only owner can delete their own comment
CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index for fast lookup by content
CREATE INDEX IF NOT EXISTS comments_content_idx ON comments (content_type, content_id, created_at);


-- ─────────────────────────────────────────
-- 3. LIKES (toastman toasts 🍞)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  TEXT NOT NULL CHECK (content_type IN ('blog', 'research')),
  content_id    TEXT NOT NULL,
  ckb_address   TEXT NOT NULL REFERENCES profiles(ckb_address) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (content_type, content_id, ckb_address)  -- one like per user per item
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes (for counts)
CREATE POLICY "likes_read" ON likes
  FOR SELECT USING (true);

-- Authenticated users can insert their own like
CREATE POLICY "likes_insert" ON likes
  FOR INSERT WITH CHECK (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only owner can remove their own like
CREATE POLICY "likes_delete" ON likes
  FOR DELETE USING (ckb_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index for fast count queries
CREATE INDEX IF NOT EXISTS likes_content_idx ON likes (content_type, content_id);


-- ─────────────────────────────────────────
-- 4. STORAGE BUCKET for avatars
-- ─────────────────────────────────────────
-- Run this separately in Storage → New bucket:
-- Name: avatars
-- Public: YES
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 2MB


-- ─────────────────────────────────────────
-- 5. HELPER VIEW — comment counts
-- ─────────────────────────────────────────
CREATE OR REPLACE VIEW content_stats AS
SELECT
  content_type,
  content_id,
  COUNT(*) FILTER (WHERE table_name = 'likes') AS like_count,
  COUNT(*) FILTER (WHERE table_name = 'comments') AS comment_count
FROM (
  SELECT content_type, content_id, 'likes' AS table_name FROM likes
  UNION ALL
  SELECT content_type, content_id, 'comments' AS table_name FROM comments
) combined
GROUP BY content_type, content_id;
