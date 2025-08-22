-- =====================================================
-- إنشاء bucket المستندات في Supabase Storage
-- =====================================================

-- إنشاء bucket جديد للمستندات
-- يمكن تنفيذ هذا في Supabase Dashboard > Storage > New Bucket
-- أو عبر SQL:

-- إنشاء bucket للمستندات
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- إنشاء سياسات RLS للمستندات
-- السماح للجميع بقراءة المستندات (لأنها عامة)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- السماح للمستخدمين المسجلين برفع المستندات
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- السماح للمستخدمين بتحديث مستنداتهم
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- السماح للمستخدمين بحذف مستنداتهم
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================
-- 1. تأكد من إنشاء bucket باسم 'documents' في Supabase Dashboard
-- 2. تأكد من تفعيل RLS (Row Level Security)
-- 3. تأكد من أن Bucket عام (public = true)
-- 4. يمكن تعديل السياسات حسب احتياجات الأمان
-- =====================================================
