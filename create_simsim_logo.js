const fs = require('fs');
const { createCanvas } = require('canvas');

// إنشاء canvas بحجم 1024x1024
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

// تعيين الخلفية الخضراء
ctx.fillStyle = '#00C897';
ctx.fillRect(0, 0, 1024, 1024);

// إضافة النص "سمسم"
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 120px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('سمسم', 512, 512);

// حفظ الصورة
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/simsim-logo.png', buffer);

console.log('تم إنشاء لوجو سمسم بنجاح!'); 