-- Allow admin to post jobs without an employer_id
ALTER TABLE job_listings ALTER COLUMN employer_id DROP NOT NULL;
