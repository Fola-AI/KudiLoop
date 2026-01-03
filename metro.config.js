const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optimize bundle for production
config.transformer = {
  ...config.transformer,
  // Note: metro-minify-terser is optional - falls back to default if not installed
  minifierConfig: {
    ecma: 2020,
    keep_classnames: false,
    keep_fnames: false,
    module: true,
    mangle: {
      module: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    compress: {
      ecma: 5,
      warnings: false,
      comparisons: false,
      inline: 2,
      // Remove console.logs in production builds
      drop_console: process.env.NODE_ENV === 'production',
      // Remove debugger statements
      drop_debugger: true,
    },
  },
};

// Enable tree shaking and inline requires for better performance
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    // Inline requires for faster startup
    inlineRequires: true,
  },
});

// Optimize resolver for faster builds
config.resolver = {
  ...config.resolver,
  // Prefer .native.js files over .js
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs'],
};

module.exports = withNativeWind(config, { input: "./global.css" });

