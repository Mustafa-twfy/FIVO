const fs = require('fs');
const path = require('path');

const pluginDir = path.join(
  __dirname,
  'node_modules',
  '@react-native',
  'gradle-plugin'
);

function fixFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(
      /allWarningsAsErrors\s*=\s*([^\n;]*)/g,
      'allWarningsAsErrors.set(\n    project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false\n)'
    );
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ تم تصحيح ${filePath}`);
    }
  }
}

if (fs.existsSync(pluginDir)) {
  const files = fs.readdirSync(pluginDir);
  files.forEach((file) => {
    if (file.endsWith('build.gradle.kts')) {
      fixFile(path.join(pluginDir, file));
    } else {
      // ابحث في المجلدات الفرعية أيضًا
      const subPath = path.join(pluginDir, file, 'build.gradle.kts');
      if (fs.existsSync(subPath)) {
        fixFile(subPath);
      }
    }
  });
} else {
  console.log('⚠️ لم يتم العثور على مجلد gradle-plugin');
} 