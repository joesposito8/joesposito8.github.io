-- One row per page view. Nothing identifies the visitor: no IP, user agent, cookie or ID.
CREATE TABLE views (
  ts INTEGER NOT NULL,  -- unix seconds
  path TEXT NOT NULL,   -- a page in the site's sitemap, e.g. /posts/my-essay/
  ref TEXT              -- referring host; NULL for direct, same-site or unknown
);
CREATE INDEX views_ts ON views (ts);

-- Running totals, so /tally reads one row per page instead of every view.
CREATE TABLE totals (path TEXT PRIMARY KEY, n INTEGER NOT NULL) WITHOUT ROWID;

-- The triggers keep totals equal to the views rows, including after a manual DELETE.
CREATE TRIGGER views_counted AFTER INSERT ON views BEGIN
  INSERT INTO totals (path, n) VALUES (NEW.path, 1) ON CONFLICT (path) DO UPDATE SET n = n + 1;
END;
CREATE TRIGGER views_removed AFTER DELETE ON views BEGIN
  UPDATE totals SET n = n - 1 WHERE path = OLD.path;
  DELETE FROM totals WHERE path = OLD.path AND n <= 0;
END;
