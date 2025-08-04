# إصلاح ميزة رابط موقع المتجر

## المشكلة التي تم حلها

كانت المشكلة أن زر "عرض موقع المتجر" لا يظهر في الطلب الجاري في لوحة تحكم السائق، وكان اسم المتجر يظهر كـ "غير محدد".

## الإصلاحات المطبقة

### 1. تحسين جلب بيانات الطلب الجاري

**الملف**: `screens/DriverDashboardScreen.js`

**التغيير**: تم تعديل استعلام قاعدة البيانات لجلب بيانات المتجر مع الطلب الجاري:

```javascript
// قبل الإصلاح
const { data: currentOrderDb } = await supabase
  .from('orders')
  .select('*')
  .eq('driver_id', parseInt(id))
  .in('status', ['accepted', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// بعد الإصلاح
const { data: currentOrderDb } = await supabase
  .from('orders')
  .select(`
    *,
    stores (
      id,
      name,
      location_url,
      address,
      phone
    )
  `)
  .eq('driver_id', parseInt(id))
  .in('status', ['accepted', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### 2. تحسين عرض زر موقع المتجر

**الملف**: `screens/DriverDashboardScreen.js`

**التغييرات**:
- إضافة زر "عرض موقع المتجر" في الطلب الجاري
- تحسين تصميم الزر مع إطار أزرق
- تحسين عرض اسم المتجر بخط عريض
- إزالة الزر المكرر

```javascript
{currentOrder.store_id ? (
  <>
    <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>
      المتجر: {currentOrder.stores?.name || 'غير محدد'}
    </Text>
    {currentOrder.stores?.location_url && (
      <TouchableOpacity 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#E3F2FD',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 10,
          marginTop: 8,
          justifyContent: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: '#2196F3'
        }}
        onPress={() => {
          Linking.openURL(currentOrder.stores.location_url);
        }}
      >
        <Ionicons name="map-outline" size={20} color="#2196F3" />
        <Text style={{color: '#2196F3', fontWeight: 'bold', fontSize: 14}}>عرض موقع المتجر</Text>
        <Ionicons name="open-outline" size={16} color="#2196F3" />
      </TouchableOpacity>
    )}
  </>
) : (
  // للطلبات من الأدمن
  <>
    <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>من: {currentOrder.pickup_address || 'غير محدد'}</Text>
    <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>إلى: {currentOrder.delivery_address || 'غير محدد'}</Text>
  </>
)}
```

## النتائج

### ✅ **ما تم إصلاحه:**

1. **عرض اسم المتجر الصحيح**: الآن يظهر اسم المتجر بدلاً من "غير محدد"
2. **زر موقع المتجر**: يظهر زر "عرض موقع المتجر" في الطلب الجاري
3. **فتح الرابط**: عند الضغط على الزر، يفتح رابط Google Maps في المتصفح
4. **تصميم محسن**: زر أكثر وضوحاً مع إطار أزرق

### 🎯 **الميزات المتاحة الآن:**

1. **في تسجيل المتجر**: إدخال رابط موقع المتجر
2. **في إنشاء الطلب**: حفظ رابط الموقع مع الطلب
3. **في الطلبات المتاحة**: زر عرض موقع المتجر
4. **في الطلب الجاري**: زر عرض موقع المتجر مع اسم المتجر الصحيح

## كيفية الاختبار

### للمتاجر:
1. سجل متجر جديد
2. أضف رابط موقع من Google Maps
3. أنشئ طلب جديد

### للسائقين:
1. سجل دخول كسائق
2. قبل طلب من متجر
3. في الطلب الجاري، ستجد:
   - اسم المتجر الصحيح
   - زر "عرض موقع المتجر" (إذا كان الرابط موجود)

## ملاحظات تقنية

- تم الحفاظ على التوافق مع الإصدارات السابقة
- لا تحتاج لإعادة تثبيت التطبيق
- تعمل على جميع الأجهزة
- تستخدم نفس قاعدة البيانات الموجودة

## الملفات المحدثة

- `screens/DriverDashboardScreen.js` - تحسين عرض الطلب الجاري
- `supabase.js` - تحسين استعلامات قاعدة البيانات

---

**تم الإصلاح بنجاح! 🎉** 