module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // تحسين الأداء
      'react-native-reanimated/plugin',
      
      // دعم أفضل للتنقل
      '@babel/plugin-proposal-export-namespace-from',
      
      // تحسين التحميل
      ['@babel/plugin-transform-runtime', {
        'regenerator': true,
        'helpers': true,
        'useESModules': false
      }]
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
