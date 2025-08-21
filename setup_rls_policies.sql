-- =====================================================
-- إعداد سياسات Row Level Security (RLS) لـ Supabase
-- =====================================================

-- 1. تعطيل RLS مؤقتاً للجداول الحيوية (للسماح بالعمليات الأساسية)
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_support_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_update_acknowledgements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;

-- 2. أو بدلاً من ذلك، يمكن تفعيل RLS مع سياسات مرنة
-- (أزل التعليق من هذا القسم إذا كنت تريد استخدام RLS مع سياسات)

/*
-- تفعيل RLS للجداول
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_requests ENABLE ROW LEVEL SECURITY;

-- سياسات للطلبات (Orders)
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;
CREATE POLICY "orders_delete_policy" ON public.orders FOR DELETE USING (true);

-- سياسات للإشعارات (Notifications)
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE USING (true);

-- سياسات لإشعارات المتاجر (Store Notifications)
DROP POLICY IF EXISTS "store_notifications_select_policy" ON public.store_notifications;
CREATE POLICY "store_notifications_select_policy" ON public.store_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_notifications_insert_policy" ON public.store_notifications;
CREATE POLICY "store_notifications_insert_policy" ON public.store_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "store_notifications_update_policy" ON public.store_notifications;
CREATE POLICY "store_notifications_update_policy" ON public.store_notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "store_notifications_delete_policy" ON public.store_notifications;
CREATE POLICY "store_notifications_delete_policy" ON public.store_notifications FOR DELETE USING (true);

-- سياسات للسائقين (Drivers)
DROP POLICY IF EXISTS "drivers_select_policy" ON public.drivers;
CREATE POLICY "drivers_select_policy" ON public.drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "drivers_insert_policy" ON public.drivers;
CREATE POLICY "drivers_insert_policy" ON public.drivers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "drivers_update_policy" ON public.drivers;
CREATE POLICY "drivers_update_policy" ON public.drivers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "drivers_delete_policy" ON public.drivers;
CREATE POLICY "drivers_delete_policy" ON public.drivers FOR DELETE USING (true);

-- سياسات للمتاجر (Stores)
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
CREATE POLICY "stores_select_policy" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "stores_insert_policy" ON public.stores;
CREATE POLICY "stores_insert_policy" ON public.stores FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "stores_update_policy" ON public.stores;
CREATE POLICY "stores_update_policy" ON public.stores FOR UPDATE USING (true);

DROP POLICY IF EXISTS "stores_delete_policy" ON public.stores;
CREATE POLICY "stores_delete_policy" ON public.stores FOR DELETE USING (true);

-- سياسات لطلبات التسجيل (Registration Requests)
DROP POLICY IF EXISTS "registration_requests_select_policy" ON public.registration_requests;
CREATE POLICY "registration_requests_select_policy" ON public.registration_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "registration_requests_insert_policy" ON public.registration_requests;
CREATE POLICY "registration_requests_insert_policy" ON public.registration_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "registration_requests_update_policy" ON public.registration_requests;
CREATE POLICY "registration_requests_update_policy" ON public.registration_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "registration_requests_delete_policy" ON public.registration_requests;
CREATE POLICY "registration_requests_delete_policy" ON public.registration_requests FOR DELETE USING (true);

-- سياسات لرسائل الدعم (Support Messages)
DROP POLICY IF EXISTS "support_messages_select_policy" ON public.support_messages;
CREATE POLICY "support_messages_select_policy" ON public.support_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "support_messages_insert_policy" ON public.support_messages;
CREATE POLICY "support_messages_insert_policy" ON public.support_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "support_messages_update_policy" ON public.support_messages;
CREATE POLICY "support_messages_update_policy" ON public.support_messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "support_messages_delete_policy" ON public.support_messages;
CREATE POLICY "support_messages_delete_policy" ON public.support_messages FOR DELETE USING (true);

-- سياسات لرسائل دعم المتاجر (Store Support Messages)
DROP POLICY IF EXISTS "store_support_messages_select_policy" ON public.store_support_messages;
CREATE POLICY "store_support_messages_select_policy" ON public.store_support_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_support_messages_insert_policy" ON public.store_support_messages;
CREATE POLICY "store_support_messages_insert_policy" ON public.store_support_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "store_support_messages_update_policy" ON public.store_support_messages;
CREATE POLICY "store_support_messages_update_policy" ON public.store_support_messages FOR UPDATE USING (true);

DROP POLICY IF EXISTS "store_support_messages_delete_policy" ON public.store_support_messages;
CREATE POLICY "store_support_messages_delete_policy" ON public.store_support_messages FOR DELETE USING (true);

-- سياسات للمكافآت (Rewards)
DROP POLICY IF EXISTS "rewards_select_policy" ON public.rewards;
CREATE POLICY "rewards_select_policy" ON public.rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "rewards_insert_policy" ON public.rewards;
CREATE POLICY "rewards_insert_policy" ON public.rewards FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rewards_update_policy" ON public.rewards;
CREATE POLICY "rewards_update_policy" ON public.rewards FOR UPDATE USING (true);

DROP POLICY IF EXISTS "rewards_delete_policy" ON public.rewards;
CREATE POLICY "rewards_delete_policy" ON public.rewards FOR DELETE USING (true);

-- سياسات للغرامات (Fines)
DROP POLICY IF EXISTS "fines_select_policy" ON public.fines;
CREATE POLICY "fines_select_policy" ON public.fines FOR SELECT USING (true);

DROP POLICY IF EXISTS "fines_insert_policy" ON public.fines;
CREATE POLICY "fines_insert_policy" ON public.fines FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "fines_update_policy" ON public.fines;
CREATE POLICY "fines_update_policy" ON public.fines FOR UPDATE USING (true);

DROP POLICY IF EXISTS "fines_delete_policy" ON public.fines;
CREATE POLICY "fines_delete_policy" ON public.fines FOR DELETE USING (true);

-- سياسات لتحديثات التطبيق (App Updates)
DROP POLICY IF EXISTS "app_updates_select_policy" ON public.app_updates;
CREATE POLICY "app_updates_select_policy" ON public.app_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_updates_insert_policy" ON public.app_updates;
CREATE POLICY "app_updates_insert_policy" ON public.app_updates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "app_updates_update_policy" ON public.app_updates;
CREATE POLICY "app_updates_update_policy" ON public.app_updates FOR UPDATE USING (true);

DROP POLICY IF EXISTS "app_updates_delete_policy" ON public.app_updates;
CREATE POLICY "app_updates_delete_policy" ON public.app_updates FOR DELETE USING (true);

-- سياسات لإقرار التحديثات (App Update Acknowledgements)
DROP POLICY IF EXISTS "app_update_acknowledgements_select_policy" ON public.app_update_acknowledgements;
CREATE POLICY "app_update_acknowledgements_select_policy" ON public.app_update_acknowledgements FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_update_acknowledgements_insert_policy" ON public.app_update_acknowledgements;
CREATE POLICY "app_update_acknowledgements_insert_policy" ON public.app_update_acknowledgements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "app_update_acknowledgements_update_policy" ON public.app_update_acknowledgements;
CREATE POLICY "app_update_acknowledgements_update_policy" ON public.app_update_acknowledgements FOR UPDATE USING (true);

DROP POLICY IF EXISTS "app_update_acknowledgements_delete_policy" ON public.app_update_acknowledgements;
CREATE POLICY "app_update_acknowledgements_delete_policy" ON public.app_update_acknowledgements FOR DELETE USING (true);

-- سياسات لإعدادات النظام (System Settings)
DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
CREATE POLICY "system_settings_select_policy" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "system_settings_insert_policy" ON public.system_settings;
CREATE POLICY "system_settings_insert_policy" ON public.system_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "system_settings_update_policy" ON public.system_settings;
CREATE POLICY "system_settings_update_policy" ON public.system_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "system_settings_delete_policy" ON public.system_settings;
CREATE POLICY "system_settings_delete_policy" ON public.system_settings FOR DELETE USING (true);
*/

-- =====================================================
-- إعطاء صلاحيات كاملة للمستخدم المسموح (anon و authenticated)
-- =====================================================

-- منح الصلاحيات للمستخدم المجهول (anon)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- منح الصلاحيات للمستخدم المُصدق عليه (authenticated)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- منح الصلاحيات لـ service_role (إذا كنت تستخدمه)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- إعطاء صلاحيات الإدراج والتحديث والحذف بشكل صريح
-- =====================================================

-- السماح بجميع العمليات على جدول الطلبات
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول الإشعارات
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول إشعارات المتاجر
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_notifications TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول رسائل الدعم
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول رسائل دعم المتاجر
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_support_messages TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول السائقين
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول المتاجر
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول طلبات التسجيل
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_requests TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول المكافآت
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول الغرامات
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fines TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول تحديثات التطبيق
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_updates TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول إقرار التحديثات
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_update_acknowledgements TO anon, authenticated, service_role;

-- السماح بجميع العمليات على جدول إعدادات النظام
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO anon, authenticated, service_role;

-- =====================================================
-- إعطاء صلاحيات الـ SEQUENCES (للـ AUTO INCREMENT)
-- =====================================================

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- تحديث الصلاحيات للجداول الحالية والمستقبلية
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- إعلام بالنجاح
SELECT 'تم إعداد سياسات RLS والصلاحيات بنجاح! جميع العمليات مسموحة الآن.' as status;
