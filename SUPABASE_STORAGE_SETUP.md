# 🗂️ إعداد Supabase Storage للمستندات

## 📋 **الخطوات المطلوبة:**

### **1. إنشاء Bucket في Supabase Dashboard:**
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **Storage** في القائمة الجانبية
4. اضغط **New Bucket**
5. أدخل:
   - **Name:** `documents`
   - **Public bucket:** ✅ (مفعل)
   - **File size limit:** `10 MB` (أو حسب الحاجة)
   - **Allowed MIME types:** `image/*`

### **2. تفعيل RLS (Row Level Security):**
1. في **Storage** > **Policies**
2. تأكد من تفعيل **Enable Row Level Security (RLS)**

### **3. إنشاء السياسات (Policies):**
```sql
-- السماح للجميع بقراءة المستندات
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- السماح للمستخدمين المسجلين برفع المستندات
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

### **4. اختبار الرفع:**
بعد الإعداد، يمكنك اختبار رفع المستندات من التطبيق.

## 🔧 **استكشاف الأخطاء:**

### **إذا لم تعمل المستندات:**
1. تأكد من إنشاء bucket باسم `documents`
2. تأكد من أن Bucket عام (public)
3. تأكد من تفعيل RLS
4. راجع Console للأخطاء

### **البديل (Base64):**
إذا لم تعمل Supabase Storage، سيتم استخدام Base64 تلقائياً كـ fallback.

## 📱 **كيفية الاستخدام:**
1. عند اختيار صورة، سيتم رفعها تلقائياً إلى Supabase
2. يتم حفظ رابط الصورة في قاعدة البيانات
3. الإدارة ستتمكن من رؤية المستندات من أي جهاز

## 🎯 **النتيجة المتوقعة:**
- ✅ المستندات ستظهر للإدارة بشكل صحيح
- ✅ يمكن الوصول للمستندات من أي جهاز
- ✅ تخزين آمن وموثوق
- ✅ أداء أفضل من Base64
