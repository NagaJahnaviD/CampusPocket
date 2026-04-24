// jest.config.js – Testing configuration for Campus Pocket
module.exports = {
  // Use the Expo preset so Jest knows how to handle React Native code
  preset: "jest-expo",

  // Where to find test files
  testMatch: ["**/__tests__/**/*.test.js"],

  // Transform files with babel — allow these React Native packages
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-paper|expo-linear-gradient)",
  ],

  // Auto-mock ThemeContext globally
  setupFiles: ["./jest.setup.js"],
};
