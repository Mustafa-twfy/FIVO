# دليل نظام الطلبات الشامل - توصيل بلس

## 📋 نظرة عامة

تم إصلاح وتطوير نظام الطلبات بالكامل ليعمل بكفاءة عالية مع جميع الميزات المطلوبة.

## 🗄️ قاعدة البيانات

### جدول الطلبات المحسن (`orders`)

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    driver_id INTEGER REFERENCES drivers(id),
    customer_name VARCHAR(255) DEFAULT 'عميل',
    customer_phone VARCHAR(20) NOT NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    items_description TEXT,
    description TEXT,
    phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'pending',
    is_urgent BOOLEAN DEFAULT false,
    priority_score DECIMAL(5,2) DEFAULT 0,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    accepted_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### حالات الطلب
- `pending` - في الانتظار
- `accepted` - مقبول من سائق
- `completed` - مكتمل
- `cancelled` - ملغي
- `rejected` - مرفوض

## 🔧 الميزات الجديدة

### 1. نظام الأولوية الذكي
- **الطلبات العاجلة**: 50 نقطة أولوية
- **المبلغ**: كل 10 دينار = نقطة واحدة
- **الوقت**: كل ساعة = نقطة واحدة (بحد أقصى 24 نقطة)

### 2. الإشعارات التلقائية
- إشعار إنشاء طلب جديد
- إشعار قبول الطلب
- إشعار إكمال الطلب
- إشعار إلغاء الطلب

### 3. التقييمات
- تقييم السائق (1-5 نجوم)
- تقييم العميل (1-5 نجوم)

### 4. الإحصائيات المتقدمة
- إجمالي الطلبات
- الطلبات حسب الحالة
- الإيرادات الإجمالية
- الطلبات العاجلة

## 📱 الشاشات المحدثة

### 1. إنشاء الطلب (`NewOrderScreen.js`)
```javascript
// استخدام API الجديد
const { data, error } = await ordersAPI.createOrder({
  store_id: storeId,
  customer_phone: phone,
  pickup_address: storeAddress,
  delivery_address: address,
  items_description: description,
  total_amount: amount,
  is_urgent: isUrgent
});
```

### 2. الطلبات المتاحة (`AvailableOrdersScreen.js`)
```javascript
// جلب الطلبات مع الأولوية
const { data, error } = await ordersAPI.getAvailableOrders();

// قبول طلب
const { error } = await ordersAPI.acceptOrder(orderId, driverId);
```

### 3. طلبات المتجر (`StoreOrdersScreen.js`)
```javascript
// جلب طلبات المتجر
const { data, error } = await ordersAPI.getStoreOrders(storeId);

// تحديث حالة الطلب
const { error } = await ordersAPI.updateOrderStatus(orderId, 'completed');
```

## 🚀 API الجديد

### دوال الطلبات (`ordersAPI`)

#### إنشاء طلب جديد
```javascript
ordersAPI.createOrder(orderData)
```

#### جلب الطلبات المتاحة
```javascript
ordersAPI.getAvailableOrders()
```

#### قبول طلب
```javascript
ordersAPI.acceptOrder(orderId, driverId)
```

#### إكمال طلب
```javascript
ordersAPI.completeOrder(orderId)
```

#### إلغاء طلب
```javascript
ordersAPI.cancelOrder(orderId, reason)
```

#### جلب طلبات السائق
```javascript
ordersAPI.getDriverOrders(driverId, status)
```

#### جلب طلبات المتجر
```javascript
ordersAPI.getStoreOrders(storeId, status)
```

#### تحديث حالة الطلب
```javascript
ordersAPI.updateOrderStatus(orderId, newStatus, notes)
```

#### تقييم الطلب
```javascript
ordersAPI.rateOrder(orderId, driverRating, customerRating)
```

#### إحصائيات الطلبات
```javascript
ordersAPI.getOrderStatistics(storeId)
```

#### جلب طلب واحد
```javascript
ordersAPI.getOrderById(orderId)
```

## 🔄 سير العمل

### 1. إنشاء الطلب
1. المتجر يدخل تفاصيل الطلب
2. النظام يحسب نقاط الأولوية تلقائياً
3. يتم إرسال إشعار للسائقين المتاحين

### 2. قبول الطلب
1. السائق يرى الطلبات المتاحة مرتبة حسب الأولوية
2. السائق يختار طلباً ويقبله
3. يتم إرسال إشعار للمتجر

### 3. إكمال الطلب
1. السائق يسلم الطلب
2. يحدث حالة الطلب إلى "مكتمل"
3. يمكن للطرفين تقييم بعضهما

### 4. إلغاء الطلب
1. يمكن للمتجر أو السائق إلغاء الطلب
2. يتم تسجيل سبب الإلغاء
3. يتم إرسال إشعار للطرف الآخر

## 📊 الإحصائيات

### إحصائيات المتجر
- إجمالي الطلبات
- الطلبات في الانتظار
- الطلبات المقبولة
- الطلبات المكتملة
- الطلبات الملغية
- الإيرادات الإجمالية
- الطلبات العاجلة

### إحصائيات السائق
- الطلبات المقبولة
- الطلبات المكتملة
- التقييمات المتلقاة
- الأرباح

## 🔧 التثبيت والإعداد

### 1. تشغيل SQL الإصلاح
```bash
# انسخ محتوى ORDER_SYSTEM_COMPLETE_FIX.sql
# والصقه في محرر SQL في Supabase
```

### 2. اختبار النظام
```bash
node test_order_system.js
```

### 3. تحديث التطبيق
```bash
# تم تحديث جميع الشاشات تلقائياً
# لاستخدام API الجديد
```

## 🎯 الميزات المضافة

### ✅ مكتمل
- [x] نظام الأولوية الذكي
- [x] الطلبات العاجلة
- [x] الإشعارات التلقائية
- [x] التقييمات
- [x] الإحصائيات المتقدمة
- [x] API محسن
- [x] التحقق من صحة البيانات
- [x] نظام الإلغاء
- [x] تتبع الوقت
- [x] الفهارس لتحسين الأداء

### 🔄 في التطوير
- [ ] نظام الدفع الإلكتروني
- [ ] تتبع GPS في الوقت الفعلي
- [ ] نظام المكافآت التلقائي
- [ ] تقارير متقدمة

## 🐛 إصلاح الأخطاء

### المشاكل المحلولة
1. **عدم عمل إنشاء الطلبات**: تم إصلاحه عبر API جديد
2. **عدم عمل قبول الطلبات**: تم إصلاحه عبر دوال محسنة
3. **عدم عمل الإشعارات**: تم إصلاحه عبر triggers تلقائية
4. **مشاكل في قاعدة البيانات**: تم إعادة هيكلة الجدول بالكامل

### الاختبار
```bash
# تشغيل اختبار شامل
node test_order_system.js
```

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من تشغيل SQL الإصلاح
2. تأكد من تحديث جميع الشاشات
3. راجع سجلات الأخطاء
4. اتصل بالدعم الفني

---

**تم تطوير هذا النظام بواسطة فريق توصيل بلس**
**آخر تحديث: ديسمبر 2024** 