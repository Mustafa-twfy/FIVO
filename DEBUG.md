# تشخيص مشكلة عدم الانتقال بين الشاشات

## المشكلة
عند تسجيل حساب كابتن جديد، لا يتم الانتقال للصفحة التالية بعد إدخال البريد الإلكتروني والرمز.

## الحلول المطبقة

### 1. تصحيح أسماء الشاشات
✅ تم تصحيح أسماء الشاشات في navigation.navigate:
- `DriverRegistrationScreen` → `DriverRegistration`
- `DriverDocumentsScreen` → `DriverDocuments`
- `DriverVehicleScreen` → `DriverVehicle`

### 2. إضافة تشخيص شامل
✅ تم إضافة console.log في جميع الدوال المهمة:
- `handleNext()` في DriverRegistrationScreen
- `validateForm()` في DriverRegistrationScreen
- `handleNext()` في DriverDocumentsScreen
- `validateDocuments()` في DriverDocumentsScreen

### 3. تحسين أزرار التنقل
✅ تم إضافة `activeOpacity={0.7}` لجميع أزرار التنقل

## خطوات التشخيص

### الخطوة 1: فتح Developer Tools
1. اضغط F12 في المتصفح
2. انتقل لتبويب Console
3. امسح Console (Clear Console)

### الخطوة 2: اختبار التطبيق
1. افتح التطبيق
2. اذهب لشاشة تسجيل الكابتن
3. أدخل بيانات صحيحة:
   - البريد: test@example.com
   - كلمة المرور: 123456
   - تأكيد كلمة المرور: 123456
4. اضغط "التالي"

### الخطوة 3: مراقبة Console
ابحث عن هذه الرسائل في Console:
```
handleNext called
formData: {email: "test@example.com", password: "123456", confirmPassword: "123456"}
Validating form...
Email: test@example.com
Password length: 6
Confirm password length: 6
Form validation passed successfully
Form validation passed, navigating to DriverDocumentsScreen
Navigation successful
```

## إذا لم تظهر الرسائل:

### المشكلة المحتملة 1: زر التالي لا يعمل
**الحل:**
```javascript
// تأكد من أن الزر يحتوي على onPress
<TouchableOpacity 
  style={styles.nextButton}
  onPress={handleNext}  // تأكد من وجود هذا
  disabled={loading}
  activeOpacity={0.7}
>
```

### المشكلة المحتملة 2: البيانات لا تُحفظ
**الحل:**
```javascript
// تأكد من أن handleInputChange يعمل
const handleInputChange = (field, value) => {
  console.log(`Updating ${field} to:`, value); // أضف هذا للتشخيص
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};
```

### المشكلة المحتملة 3: مشكلة في التنقل
**الحل:**
```javascript
// تأكد من أن navigation متاح
console.log('Navigation object:', navigation);
console.log('Available routes:', navigation.getState().routes);
```

## اختبار سريع

### اختبار 1: التحقق من البيانات
```javascript
// أضف هذا في بداية handleNext
console.log('Current formData state:', formData);
console.log('Email is:', formData.email);
console.log('Password is:', formData.password);
console.log('Confirm password is:', formData.confirmPassword);
```

### اختبار 2: التحقق من التنقل
```javascript
// أضف هذا قبل navigation.navigate
console.log('About to navigate to DriverDocuments');
console.log('Navigation object exists:', !!navigation);
console.log('Navigation.navigate exists:', !!navigation.navigate);
```

### اختبار 3: اختبار بسيط
```javascript
// استبدل handleNext مؤقتاً بهذا
const handleNext = () => {
  console.log('Button pressed!');
  Alert.alert('اختبار', 'الزر يعمل!');
};
```

## إذا استمرت المشكلة:

1. **أعد تشغيل التطبيق:**
   ```bash
   npm start -- --clear
   ```

2. **تحقق من التبعيات:**
   ```bash
   npm install
   ```

3. **تحقق من إصدار React Navigation:**
   ```bash
   npm list @react-navigation/native
   ```

4. **أضف تشخيص إضافي:**
   ```javascript
   // في بداية الملف
   console.log('DriverRegistrationScreen loaded');
   
   // في useEffect
   useEffect(() => {
     console.log('DriverRegistrationScreen mounted');
   }, []);
   ```

## النتيجة المتوقعة
بعد تطبيق هذه الحلول، يجب أن يعمل التنقل بشكل صحيح. إذا استمرت المشكلة، ستظهر رسائل تشخيص في Console تساعد في تحديد المشكلة بدقة. 