const fs = require('fs');
const path = require('path');

const gradleFile = path.join(
  __dirname,
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'react-native-gradle-plugin',
  'build.gradle.kts'
);

if (fs.existsSync(gradleFile)) {
  let content = fs.readFileSync(gradleFile, 'utf8');
  // استبدال السطر المسبب للمشكلة
  content = content.replace(
    /allWarningsAsErrors\s*=\s*([^\n;]*)/g,
    'allWarningsAsErrors.set(\n    project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false\n)'
  );
  fs.writeFileSync(gradleFile, content, 'utf8');
  console.log('✅ تم تصحيح build.gradle.kts تلقائيًا');
} else {
  console.log('⚠️ لم يتم العثور على ملف build.gradle.kts');
} 