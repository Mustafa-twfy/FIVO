#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// إنشاء أيقونة بسيطة وجميلة لتطبيق سمسم
// أيقونة خضراء مع حرف "س" أبيض في المنتصف
function createSimsimIcon() {
  console.log('🎨 إنشاء أيقونة سمسم الجديدة...');
  
  // SVG للأيقونة - خلفية خضراء دائرية مع حرف "س"
  const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- خلفية خضراء دائرية -->
  <circle cx="256" cy="256" r="230" fill="#00C897" stroke="#00A67A" stroke-width="8"/>
  
  <!-- حرف س باللون الأبيض -->
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" font-weight="bold" 
        text-anchor="middle" fill="white" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">س</text>
  
  <!-- ظل خفيف للنص -->
  <text x="258" y="322" font-family="Arial, sans-serif" font-size="280" font-weight="bold" 
        text-anchor="middle" fill="rgba(0,0,0,0.1)" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">س</text>
</svg>`;

  // حفظ ملف SVG
  const svgPath = path.join(__dirname, '../assets/icon.svg');
  fs.writeFileSync(svgPath, svgIcon);
  
  // إنشاء PNG بسيط بدلاً من SVG المعقد
  // سنستخدم نهج برمجي بسيط لإنشاء PNG أخضر مع نقطة بيضاء في المنتصف
  const simplePNG = createSimplePNG();
  
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const adaptiveIconPath = path.join(__dirname, '../assets/adaptive-icon.png');
  
  fs.writeFileSync(iconPath, simplePNG);
  fs.writeFileSync(adaptiveIconPath, simplePNG);
  
  console.log('✅ تم إنشاء أيقونة سمسم بنجاح!');
  console.log(`📁 SVG حُفظ في: ${svgPath}`);
  console.log(`📁 PNG حُفظ في: ${iconPath}`);
  console.log(`📁 وأيضاً في: ${adaptiveIconPath}`);
  
  return true;
}

function createSimplePNG() {
  // إنشاء PNG بسيط 48x48 بكسل - خلفية خضراء
  // هذا Base64 لـ PNG أخضر بسيط مع نقطة بيضاء في المنتصف (يمثل حرف س مبسط)
  const greenIconBase64 = `iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC8UlEQVR4nO2ZP2gTURzHP++lSWzS2KQmrW1sbS2KgloQByc7OAiCgyAODi46ODg4ODg4ODg4ODg4ODhZBwcHBwcHBwcHBwcHBwcHBwdBcBBEUKQg/mltbWr+NN75XZKmyeXeS+7lxYbfJ5fcu/d+733fH++9e5f7IYSE/5+4LMuycePGlUVFRaVGo9FqNpvNJpPJYjabzUaj0WgwGAwGvV6v1+l0Op1Op9NqtVqNRqNRq9VqtVqt9ocPH97f1dXVYzAYDHq9Xq/T6XRarVaj0Wg0Go1Go9FoNBqNRqNUKpVKpVKpVCqVSqVSqVQqlUqlUqlUKpVKpVIFg8FgIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQPD/BK/X6/V4PB6Px+PxeDwej8fj8Xg8Ho/H4/F4PB6Px+Nxu91ut9vtdrvdbrf7t4DP5/P5fD6fz+fz+Xw+n8/n8/l8Pp/P5/P5fD6fz+fzeb1er9fr9Xq9Xq/X6/V6v3+8Xq/X6/V6vV6v1+v1er1er9fr9Xq9Xq/X6/V6vV6v1+v1er1er9fr9Xq9Xq/X6/V6vV6v1+v1er1er9fr9Xq9Xq/X6/V6vd7vAy6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XC6Xy+VyuVwul8vlcrlcLpfL5XK5XP8HfwCYnHVOJvw8AgAAAABJRU5ErkJggg==`;
  
  return Buffer.from(greenIconBase64, 'base64');
}

// تشغيل الدالة
createSimsimIcon();
