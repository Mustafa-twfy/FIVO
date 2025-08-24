module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // دعم أفضل للتنقل
      '@babel/plugin-transform-export-namespace-from',
      
      // تحسين التحميل
      ['@babel/plugin-transform-runtime', {
        'regenerator': true,
        'helpers': true,
        'useESModules': false
      }],
      // تحسين الأداء (react-native-reanimated plugin يجب أن يكون آخر إضافة)
      'react-native-reanimated/plugin'
    ],
    
    // تحسينات إضافية
    env: {
      production: {
        plugins: [
          'transform-remove-console',
          'transform-remove-debugger'
        ]
      }
    }
  };
};
