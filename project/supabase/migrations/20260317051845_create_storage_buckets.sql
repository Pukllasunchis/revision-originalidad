/*
  # Create Storage Buckets for Files

  1. Storage Buckets
    - `documents` - For storing research works and theses (PDF/Word)
    - `receipts` - For storing payment receipts (images/PDF)

  2. Security
    - Public can upload files (for form submission)
    - Anyone can download files they need
    - Authenticated users can delete files
*/

-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Anyone can upload documents"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can read documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Storage policies for receipts bucket
CREATE POLICY "Anyone can upload receipts"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Anyone can read receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can delete receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts');