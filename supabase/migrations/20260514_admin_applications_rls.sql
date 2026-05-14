-- Allow admins to update applications for admin-posted jobs (where employer_id is NULL)
-- This policy enables admins to shortlist, accept, or reject applicants

CREATE POLICY "Allow admins to update applications for admin jobs" 
ON applications 
FOR UPDATE 
USING (
  -- Allow if the job belongs to an admin (employer_id IS NULL)
  EXISTS (
    SELECT 1 FROM job_listings jl 
    WHERE jl.id = applications.job_listing_id 
    AND jl.employer_id IS NULL
    AND auth.uid() IN (SELECT id FROM admins)
  )
)
WITH CHECK (
  -- Same check for with clause
  EXISTS (
    SELECT 1 FROM job_listings jl 
    WHERE jl.id = applications.job_listing_id 
    AND jl.employer_id IS NULL
    AND auth.uid() IN (SELECT id FROM admins)
  )
);
