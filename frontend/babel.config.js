// babel.config.js – Configures Babel for Expo + Expo Router
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
