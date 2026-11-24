-- Additive and idempotent. Existing students inherit cycle prices via NULL.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE students ADD COLUMN IF NOT EXISTS tuition_amount NUMERIC(10,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10,2);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='students'::regclass AND conname='students_tuition_amount_check') THEN
    ALTER TABLE students ADD CONSTRAINT students_tuition_amount_check CHECK (tuition_amount IS NULL OR tuition_amount BETWEEN 0.01 AND 99999999.99);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='students'::regclass AND conname='students_monthly_amount_check') THEN
    ALTER TABLE students ADD CONSTRAINT students_monthly_amount_check CHECK (monthly_amount IS NULL OR monthly_amount BETWEEN 0.01 AND 99999999.99);
  END IF;
END $$;
COMMIT;
