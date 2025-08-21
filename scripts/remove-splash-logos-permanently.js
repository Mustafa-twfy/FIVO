#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🗑️ حذف ملفات splashscreen_logo.png نهائياً من Git...');

const logoFiles = [
  'android/app/src/main/res/drawable-mdpi/splashscreen_logo.png',
  'android/app/src/main/res/drawable-hdpi/splashscreen_logo.png',
  'android/app/src/main/res/drawable-xhdpi/splashscreen_logo.png',
  'android/app/src/main/res/drawable-xxhdpi/splashscreen_logo.png',
  'android/app/src/main/res/drawable-xxxhdpi/splashscreen_logo.png'
];

let deletedFiles = 0;

// حذف الملفات محلياً
logoFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ حُذف ${file}`);
      deletedFiles++;
    } else {
      console.log(`ℹ️ لا يوجد ${file}`);
    }
  } catch (error) {
    console.log(`❌ خطأ في حذف ${file}: ${error.message}`);
  }
});

// حذف الملفات من Git history
console.log('\n🔄 حذف الملفات من Git...');
logoFiles.forEach(file => {
  try {
    execSync(`git rm --cached "${file}"`, { stdio: 'ignore' });
    console.log(`✅ حُذف ${file} من Git`);
  } catch (error) {
    console.log(`ℹ️ ${file} ليس في Git`);
  }
});

// إنشاء .gitignore entry لمنع عودة هذه الملفات
const gitignorePath = path.join(__dirname, '..', '.gitignore');
const ignoreEntry = '\n# منع ملفات splash screen الفاسدة\nandroid/app/src/main/res/drawable-*/splashscreen_logo.png\n';

try {
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  if (!gitignoreContent.includes('splashscreen_logo.png')) {
    fs.appendFileSync(gitignorePath, ignoreEntry);
    console.log('✅ تم إضافة قاعدة .gitignore لمنع عودة الملفات');
  }
} catch (error) {
  console.log('⚠️ خطأ في تحديث .gitignore:', error.message);
}

console.log(`\n📊 تم حذف ${deletedFiles} ملف محلياً`);
console.log('\n🚀 الخطوات التالية:');
console.log('1. git add .');
console.log('2. git commit -m "🗑️ حذف ملفات splashscreen_logo الفاسدة نهائياً"');
console.log('3. git push origin main');
console.log('\n✨ سيتم البناء بنجاح بعد ذلك!');
