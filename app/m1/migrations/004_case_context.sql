CREATE TABLE m1_case_context (
 recording_id TEXT PRIMARY KEY REFERENCES af_recordings(id),
 context_json TEXT NOT NULL,
 updated_at INTEGER NOT NULL
);
DROP TABLE m1_meta;
CREATE TABLE m1_meta (version INTEGER PRIMARY KEY CHECK(version=4));
INSERT INTO m1_meta VALUES(4);
