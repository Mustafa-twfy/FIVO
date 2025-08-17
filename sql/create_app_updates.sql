-- جدول الإعلانات/التحديثات الذي يديره الأدمن
CREATE TABLE IF NOT EXISTS app_updates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['driver','store']::text[],
  version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  dismissible BOOLEAN DEFAULT TRUE,
  show_from TIMESTAMPTZ DEFAULT now(),
  show_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول لتخزين إقرار/مشاهدة المستخدم للإشعار
CREATE TABLE IF NOT EXISTS app_update_acknowledgements (
  id SERIAL PRIMARY KEY,
  update_id INTEGER REFERENCES app_updates(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL,
  seen_at TIMESTAMPTZ DEFAULT now(),
  dismissed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ack_update_user ON app_update_acknowledgements(update_id, user_id, user_type);


