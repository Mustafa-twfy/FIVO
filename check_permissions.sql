-- =====================================================
-- فحص حالة الصلاحيات وسياسات RLS في Supabase
-- =====================================================

-- 1. فحص حالة RLS للجداول الرئيسية
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS_Enabled",
    CASE 
        WHEN rowsecurity THEN 'مُفعّل' 
        ELSE 'مُعطّل' 
    END as "حالة_RLS"
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('orders', 'notifications', 'store_notifications', 'drivers', 'stores', 'registration_requests', 'support_messages', 'store_support_messages', 'rewards', 'fines', 'app_updates', 'system_settings')
ORDER BY tablename;

-- 2. فحص السياسات المُعرّفة للجداول
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'notifications', 'store_notifications', 'drivers', 'stores', 'registration_requests', 'support_messages', 'store_support_messages', 'rewards', 'fines', 'app_updates', 'system_settings')
ORDER BY tablename, policyname;

-- 3. فحص الصلاحيات للأدوار
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('orders', 'notifications', 'store_notifications', 'drivers', 'stores', 'registration_requests', 'support_messages', 'store_support_messages', 'rewards', 'fines', 'app_updates', 'system_settings')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- 4. فحص صلاحيات الـ SEQUENCES
SELECT 
    grantee,
    object_schema,
    object_name,
    privilege_type
FROM information_schema.usage_privileges 
WHERE object_schema = 'public' 
    AND object_type = 'SEQUENCE'
    AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY object_name, grantee;

-- 5. اختبار إدراج بسيط لمعرفة إذا كانت الصلاحيات تعمل
SELECT 'فحص الصلاحيات مكتمل. راجع النتائج أعلاه لمعرفة حالة كل جدول.' as message;

-- 6. فحص وجود الجداول
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'موجود'
        ELSE 'غير موجود'
    END as "حالة_الجدول"
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('orders', 'notifications', 'store_notifications', 'drivers', 'stores', 'registration_requests', 'support_messages', 'store_support_messages', 'rewards', 'fines', 'app_updates', 'system_settings')
ORDER BY table_name;
