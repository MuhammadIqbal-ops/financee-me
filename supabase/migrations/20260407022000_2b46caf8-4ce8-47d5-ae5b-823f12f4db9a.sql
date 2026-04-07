
-- 1. Make receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- 2. Drop overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

-- 3. Create owner-scoped SELECT policy (user folder = auth.uid())
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Drop the insecure INSERT policy
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;

-- 5. Create owner-scoped INSERT policy
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 6. Drop and recreate DELETE policy with proper ownership check
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
