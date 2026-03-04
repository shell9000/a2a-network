-- 添加 api_key 列到 verification_tokens 表
ALTER TABLE verification_tokens ADD COLUMN api_key TEXT;
