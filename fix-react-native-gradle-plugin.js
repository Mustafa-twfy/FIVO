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

function walkAndFix(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndFix(fullPath);
    } else if (file.endsWith('build.gradle.kts') || file.endsWith('settings.gradle.kts')) {
      fixFile(fullPath);
    }
  });
}

if (fs.existsSync(pluginDir)) {
  walkAndFix(pluginDir);
} else {
  console.log('⚠️ لم يتم العثور على مجلد gradle-plugin');
} 