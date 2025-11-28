import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children, style }) => <div style={style}>{children}</div>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Rect: 'Rect',
  G: 'G',
  Text: 'Text',
  Line: 'Line',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  Ellipse: 'Ellipse',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  RadialGradient: 'RadialGradient',
  Stop: 'Stop',
  ClipPath: 'ClipPath',
  Mask: 'Mask',
  Pattern: 'Pattern',
  Use: 'Use',
  Symbol: 'Symbol',
  Marker: 'Marker',
  Image: 'Image',
  ForeignObject: 'ForeignObject',
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock react-native-date-picker
jest.mock('react-native-date-picker', () => 'DatePicker');
