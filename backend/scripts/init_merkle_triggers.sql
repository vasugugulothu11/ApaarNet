-- Merkle Audit Log Trigger: Automatic SHA-256 Hash Chaining
CREATE OR REPLACE FUNCTION fn_merkle_audit_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    last_hash TEXT;
BEGIN
    -- If prev_hash is not provided, automatically chain to the latest record_hash
    IF NEW.prev_hash IS NULL OR NEW.prev_hash = '' THEN
        SELECT record_hash INTO last_hash
        FROM merkle_audit_log
        ORDER BY seq_id DESC
        LIMIT 1;

        NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
    END IF;

    -- Automatically compute SHA-256 hash across prev_hash + payload_json
    NEW.record_hash := encode(
        sha256(convert_to(COALESCE(NEW.prev_hash, 'GENESIS') || NEW.payload_json::text, 'UTF8')),
        'hex'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merkle_audit_log_insert ON merkle_audit_log;
CREATE TRIGGER trg_merkle_audit_log_insert
BEFORE INSERT ON merkle_audit_log
FOR EACH ROW
EXECUTE FUNCTION fn_merkle_audit_log_insert();


-- Merkle Audit Log Immutability Trigger: Prohibit UPDATE and DELETE
CREATE OR REPLACE FUNCTION fn_merkle_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'MerkleAuditLog is an append-only cryptographic ledger. UPDATE and DELETE operations are strictly prohibited!';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merkle_audit_log_immutable ON merkle_audit_log;
CREATE TRIGGER trg_merkle_audit_log_immutable
BEFORE UPDATE OR DELETE ON merkle_audit_log
FOR EACH ROW
EXECUTE FUNCTION fn_merkle_audit_log_immutable();
