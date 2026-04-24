// jest.setup.js – Global mocks for all tests
const { buildTheme } = require("./src/theme/theme");

const mockTheme = buildTheme("light");

// Mock ThemeContext globally so every component that calls useTheme() works
jest.mock("./src/context/ThemeContext", () => ({
  __esModule: true,
  useTheme: () => ({
    theme: mockTheme,
    mode: "light",
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock expo-linear-gradient
jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    LinearGradient: (props) => <View {...props} />,
  };
});
