# دليل الاختبار التدريجي للشاشات

## 🎯 **الهدف:**
اختبار الشاشات واحدة تلو الأخرى للتأكد من عملها بدون شاشة بيضاء

---

## 📱 **الاختبار الأول: الشاشة الأساسية**

### ما يجب أن تراه:
- ✅ شاشة تسجيل الدخول (LoginScreen)
- ✅ لا توجد شاشة بيضاء
- ✅ النصوص العربية تظهر بشكل صحيح

### إذا نجح:
انتقل للاختبار التالي

### إذا فشل:
ارجع لـ SimpleApp.js

---

## 📱 **الاختبار الثاني: شاشات التسجيل**

### اختبر هذه الشاشات:
1. **DriverRegistrationScreen** - تسجيل السائق
2. **UnifiedStoreRegistrationScreen** - تسجيل المتجر
3. **DriverDocumentsScreen** - مستندات السائق
4. **DriverVehicleScreen** - مركبة السائق

### طريقة الاختبار:
1. اضغط على "تسجيل جديد" في شاشة تسجيل الدخول
2. تأكد من ظهور الشاشة التالية
3. تأكد من عدم وجود شاشة بيضاء

---

## 📱 **الاختبار الثالث: شاشات الموافقة**

### اختبر هذه الشاشات:
1. **PendingApprovalScreen** - انتظار الموافقة
2. **UnifiedPendingApprovalScreen** - انتظار الموافقة الموحد

---

## 📱 **الاختبار الرابع: لوحات التحكم**

### اختبر هذه الشاشات:
1. **DriverDashboardScreen** - لوحة تحكم السائق
2. **StoreDashboardScreen** - لوحة تحكم المتجر
3. **AdminDashboardScreen** - لوحة تحكم الإدارة

---

## 📱 **الاختبار الخامس: الشاشات الفرعية**

### اختبر هذه الشاشات:
1. **AvailableOrdersScreen** - الطلبات المتاحة
2. **MyOrdersScreen** - طلباتي
3. **DriverProfileScreen** - الملف الشخصي
4. **StoreProfileScreen** - ملف المتجر

---

## 🔧 **خطوات الاختبار لكل شاشة:**

### 1. **افتح الشاشة**
### 2. **تحقق من:**
- ✅ تظهر الشاشة فوراً
- ✅ لا توجد شاشة بيضاء
- ✅ النصوص العربية صحيحة
- ✅ الأزرار تعمل
- ✅ لا توجد أخطاء في Console

### 3. **إذا واجهت مشكلة:**
- تحقق من Console Logs
- تأكد من وجود الملف
- تحقق من الاستيرادات

---

## 🚨 **الشاشات التي قد تحتاج إصلاح:**

### الشاشات المعقدة:
- **AdminDashboardScreen** - قد تحتاج تبسيط
- **FinancialAccountsScreen** - قد تحتاج تبسيط
- **SupportChatScreen** - قد تحتاج تبسيط

### الشاشات التي تستخدم قاعدة البيانات:
- **AvailableOrdersScreen**
- **MyOrdersScreen**
- **StoreOrdersScreen**

---

## 📋 **قائمة الشاشات المطلوبة:**

### ✅ **الشاشات الأساسية:**
- [x] LoginScreen
- [x] SplashScreen
- [x] ErrorScreen
- [x] ErrorBoundary

### 🔄 **شاشات التسجيل:**
- [ ] DriverRegistrationScreen
- [ ] UnifiedStoreRegistrationScreen
- [ ] DriverDocumentsScreen
- [ ] DriverVehicleScreen

### 🔄 **شاشات الموافقة:**
- [ ] PendingApprovalScreen
- [ ] UnifiedPendingApprovalScreen

### 🔄 **لوحات التحكم:**
- [ ] DriverDashboardScreen
- [ ] StoreDashboardScreen
- [ ] AdminDashboardScreen

### 🔄 **الشاشات الفرعية:**
- [ ] AvailableOrdersScreen
- [ ] MyOrdersScreen
- [ ] DriverProfileScreen
- [ ] StoreProfileScreen
- [ ] FinancialAccountsScreen
- [ ] RewardsScreen
- [ ] SupportChatScreen
- [ ] DriverNotificationsScreen
- [ ] StoreNotificationsScreen

---

## 🎉 **عند اكتمال جميع الاختبارات:**

ستكون قد تأكدت من:
- ✅ عمل جميع الشاشات
- ✅ عدم وجود شاشة بيضاء
- ✅ عمل التنقل بين الشاشات
- ✅ عمل المصادقة
- ✅ عمل قاعدة البيانات

---

## 📞 **إذا واجهت مشكلة:**

1. **ارسل لي اسم الشاشة** التي لا تعمل
2. **ارسل لي رسالة الخطأ** من Console
3. **سأقوم بإصلاحها** فوراً

**ابدأ بالاختبار وأخبرني بالنتيجة!** 🚀
