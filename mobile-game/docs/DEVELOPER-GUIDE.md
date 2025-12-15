# Developer Guide

![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Building](#building)
- [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

**Required:**
- Node.js 18+ ([Download](https://nodejs.org/))
- npm or yarn
- Git
- JDK 17+ ([Download](https://adoptium.net/))

**For Android:**
- Android Studio ([Download](https://developer.android.com/studio))
- Android SDK Platform 33
- Android SDK Build-Tools 33.0.0

**For iOS (macOS only):**
- Xcode 14+ ([Download](https://developer.apple.com/xcode/))
- CocoaPods (`sudo gem install cocoapods`)

---

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/mobile-game.git
cd mobile-game/mobile-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API URLs

# 4. Setup Android SDK (if not done)
echo "sdk.dir=/path/to/Android/sdk" > android/local.properties

# 5. Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# 6. Verify installation
npx react-native doctor
```

---

### Running the App

**Android:**
```bash
# Start Metro bundler
npm start

# Run on emulator/device (new terminal)
npm run android

# Or specific device
npx react-native run-android --deviceId=DEVICE_ID
```

**iOS (macOS only):**
```bash
# Run on simulator
npm run ios

# Or specific simulator
npm run ios -- --simulator="iPhone 14 Pro"
```

**Development Server:**
```bash
# Start with cache reset
npm start -- --reset-cache

# Clear all caches
npm start -- --reset-cache && rm -rf /tmp/metro-*
```

---

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/              # Screen components
│   │   └── MapScreen.js      # Main map interface
│   │
│   ├── components/           # Reusable UI components
│   │   ├── BeingCard.js
│   │   └── ResourceBar.js
│   │
│   ├── services/             # Business logic
│   │   ├── SyncService.js    # Web↔Mobile sync
│   │   └── LocationService.js
│   │
│   ├── stores/               # State management
│   │   └── gameStore.js      # Zustand store
│   │
│   ├── config/               # Configuration
│   │   └── constants.js      # Game constants
│   │
│   ├── utils/                # Helper functions
│   │   ├── distance.js
│   │   └── validators.js
│   │
│   └── assets/               # Static resources
│       ├── images/
│       ├── sounds/
│       └── fonts/
│
├── android/                  # Native Android code
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/awakeningprotocol/
│   └── build.gradle
│
├── ios/                      # Native iOS code
│   ├── AwakeningProtocol/
│   │   ├── Info.plist
│   │   └── AppDelegate.mm
│   └── AwakeningProtocol.xcodeproj
│
├── __tests__/                # Test files
│   ├── unit/
│   └── integration/
│
├── .env                      # Environment variables (gitignored)
├── package.json              # Dependencies
├── babel.config.js           # Babel configuration
├── metro.config.js           # Metro bundler config
└── README.md                 # Project README
```

---

## Development Workflow

### Git Workflow

We follow **Git Flow** with some modifications:

```
main (production)
  └── develop (integration)
       ├── feature/map-improvements
       ├── feature/being-fusion
       └── bugfix/sync-error
```

**Branch Naming:**
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation only

**Example Workflow:**

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/crisis-details

# 2. Make changes, commit frequently
git add .
git commit -m "feat: add crisis detail screen"

# 3. Keep branch updated
git fetch origin
git rebase origin/develop

# 4. Push and create PR
git push origin feature/crisis-details
# Create PR on GitHub: feature/crisis-details → develop
```

---

### Commit Message Format

We use **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructure
- `perf`: Performance improvement
- `test`: Add/update tests
- `chore`: Build/config changes

**Examples:**

```bash
feat(map): add fractal collection animation

fix(sync): prevent duplicate being creation
Closes #123

refactor(store): migrate to Zustand from Redux
BREAKING CHANGE: Redux removed, update imports

docs(api): add endpoint examples
```

---

## Coding Standards

### JavaScript/React Native Style

**File Naming:**
- Components: `PascalCase.js` (e.g., `BeingCard.js`)
- Services: `camelCase.js` (e.g., `syncService.js`)
- Utils: `camelCase.js` (e.g., `validators.js`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)

**Code Style:**
```javascript
// ✅ GOOD
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  // ... calculation
  return distance;
};

// ❌ BAD
function calcDist(a,b,c,d){
  var R=6371e3
  var x=a*Math.PI/180
  // ...
  return result
}
```

**Naming Conventions:**
```javascript
// Variables: descriptive camelCase
const userEnergyLevel = 100;
const isBeingAvailable = true;

// Constants: UPPER_SNAKE_CASE
const MAX_BEINGS = 100;
const API_TIMEOUT = 5000;

// Functions: verb + noun
const fetchUserData = () => {};
const calculateSuccessProbability = () => {};
const validateUserInput = () => {};

// Components: PascalCase
const BeingCard = () => {};
const ResourceBar = () => {};
```

**JSDoc Comments:**
```javascript
/**
 * Calculate success probability for a mission
 *
 * @param {Object} being - The being to deploy
 * @param {Object} crisis - The crisis to address
 * @returns {number} Success probability (0-100)
 *
 * @example
 * const prob = calculateSuccess(myBeing, localCrisis);
 * console.log(prob); // 85
 */
const calculateSuccess = (being, crisis) => {
  // Implementation
};
```

---

### ESLint Configuration

We use ESLint with React Native preset:

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-native/no-inline-styles': 'warn',
    'no-console': 'off', // Allow console for debugging
    'prettier/prettier': 'error',
    'no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

**Run Linter:**
```bash
# Check for issues
npm run lint

# Auto-fix
npm run lint -- --fix
```

---

### Prettier Configuration

```javascript
// .prettierrc.js
module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: 'es5',
  semi: true,
  printWidth: 100,
  tabWidth: 2
};
```

---

## Testing

### Unit Tests (Jest)

**File Structure:**
```
__tests__/
├── unit/
│   ├── utils/
│   │   └── distance.test.js
│   ├── services/
│   │   └── SyncService.test.js
│   └── stores/
│       └── gameStore.test.js
```

**Example Test:**
```javascript
// __tests__/unit/utils/distance.test.js
import { calculateDistance } from '../../../src/utils/distance';

describe('calculateDistance', () => {
  it('calculates distance between two points correctly', () => {
    const madrid = { lat: 40.4168, lon: -3.7038 };
    const barcelona = { lat: 41.3851, lon: 2.1734 };

    const distance = calculateDistance(
      madrid.lat, madrid.lon,
      barcelona.lat, barcelona.lon
    );

    // Approx 504 km
    expect(distance).toBeGreaterThan(500000);
    expect(distance).toBeLessThan(510000);
  });

  it('returns 0 for same location', () => {
    const dist = calculateDistance(40.4168, -3.7038, 40.4168, -3.7038);
    expect(dist).toBe(0);
  });
});
```

**Run Tests:**
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific file
npm test -- distance.test.js
```

---

### Component Tests (React Testing Library)

```javascript
// __tests__/unit/components/BeingCard.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BeingCard from '../../../src/components/BeingCard';

describe('BeingCard', () => {
  const mockBeing = {
    id: '123',
    name: 'Test Being',
    dominant_attribute: 'empathy',
    attributes: { empathy: 75 }
  };

  it('renders being name correctly', () => {
    const { getByText } = render(<BeingCard being={mockBeing} />);
    expect(getByText('Test Being')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <BeingCard being={mockBeing} onPress={onPressMock} />
    );

    fireEvent.press(getByTestId('being-card'));
    expect(onPressMock).toHaveBeenCalledWith(mockBeing);
  });
});
```

---

### Integration Tests

```javascript
// __tests__/integration/sync.test.js
import SyncService from '../../src/services/SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('SyncService Integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('syncs beings from web to mobile', async () => {
    const userId = 'test-user-id';

    // Mock API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          status: 'success',
          data: { beings: [{ id: '1', name: 'Test' }] }
        })
      })
    );

    const result = await SyncService.syncFromWeb(userId);

    expect(result.success).toBe(true);
    expect(result.result.beings.new).toBe(1);

    // Verify stored in AsyncStorage
    const stored = await AsyncStorage.getItem(`mobile_beings_${userId}`);
    const beings = JSON.parse(stored);
    expect(beings).toHaveLength(1);
  });
});
```

---

## Debugging

### React Native Debugger

**Install:**
```bash
brew install react-native-debugger
```

**Usage:**
1. Start app in debug mode
2. Open React Native Debugger (`Command+T` on macOS)
3. In app, shake device/press `Cmd+D` (iOS) or `Cmd+M` (Android)
4. Select "Debug JS Remotely"

---

### Console Logs

```javascript
// Development logs
console.log('User location:', userLocation);
console.warn('Energy low:', user.energy);
console.error('API failed:', error);

// Production: Use logger utility
import Logger from './utils/logger';

Logger.info('User logged in', { userId });
Logger.error('Sync failed', { error, userId });
```

---

### Flipper (Advanced)

**Install:**
```bash
brew install flipper
```

**Features:**
- Network inspector
- AsyncStorage viewer
- Layout inspector
- Crash reporter

**Enable in Development:**
Already enabled in React Native 0.73+ by default.

---

### Common Issues

**Metro bundler won't start:**
```bash
# Kill all node processes
killall -9 node

# Clear caches
rm -rf /tmp/metro-*
rm -rf node_modules
npm install

# Restart with clean cache
npm start -- --reset-cache
```

**Android build fails:**
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

**iOS build fails (macOS):**
```bash
# Clean build folder
cd ios
xcodebuild clean
rm -rf build/
pod deintegrate
pod install
cd ..

# Rebuild
npm run ios
```

---

## Building

### Android APK

**Debug Build:**
```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Release Build:**
```bash
# 1. Generate keystore (first time only)
keytool -genkeypair -v \
  -keystore awakening-release.keystore \
  -alias awakening-key \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Configure signing in android/gradle.properties
# MYAPP_RELEASE_STORE_FILE=awakening-release.keystore
# MYAPP_RELEASE_KEY_ALIAS=awakening-key
# MYAPP_RELEASE_STORE_PASSWORD=****
# MYAPP_RELEASE_KEY_PASSWORD=****

# 3. Build release APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

### iOS IPA (macOS)

**Archive:**
```bash
# 1. Open Xcode
open ios/AwakeningProtocol.xcworkspace

# 2. Select "Any iOS Device (arm64)" as target
# 3. Product → Archive
# 4. Distribute App → Ad Hoc/App Store
```

---

## Common Tasks

### Adding a New Screen

```bash
# 1. Create screen file
touch src/screens/CrisisDetailScreen.js

# 2. Add to navigation (App.js or navigation/index.js)
import CrisisDetailScreen from './src/screens/CrisisDetailScreen';

// In Stack.Navigator:
<Stack.Screen name="CrisisDetail" component={CrisisDetailScreen} />

# 3. Navigate from another screen
navigation.navigate('CrisisDetail', { crisisId: '123' });
```

---

### Adding a New Dependency

```bash
# Install package
npm install react-native-package

# Link native modules (if needed)
cd ios && pod install && cd ..

# Rebuild
npm run android  # or npm run ios
```

---

### Updating Constants

```javascript
// src/config/constants.js

export const NEW_CONSTANT = {
  VALUE: 100,
  OPTIONS: ['a', 'b', 'c']
};

// Usage in components
import { NEW_CONSTANT } from '../config/constants';
```

---

### Adding State to Store

```javascript
// src/stores/gameStore.js

const useGameStore = create((set, get) => ({
  // Add new state
  newFeature: false,

  // Add action
  toggleNewFeature: () => set(state => ({
    newFeature: !state.newFeature
  }))
}));
```

---

### Environment Variables

```bash
# .env (gitignored)
API_BASE_URL=https://api.example.com
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
ENABLE_DEV_TOOLS=true
```

```javascript
// Access in code
import Config from 'react-native-config';

const apiUrl = Config.API_BASE_URL;
```

---

## Performance Optimization

### Profiling

```javascript
// Use React Profiler
import { Profiler } from 'react';

<Profiler id="MapScreen" onRender={onRenderCallback}>
  <MapScreen />
</Profiler>

function onRenderCallback(id, phase, actualDuration) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}
```

### Optimization Tips

1. **Memoization:**
```javascript
import { useMemo, useCallback } from 'react';

const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => /* expensive operation */);
  }, [data]);

  const handlePress = useCallback(() => {
    // handler logic
  }, []);

  return <View>...</View>;
};
```

2. **FlatList Optimization:**
```javascript
<FlatList
  data={beings}
  renderItem={renderBeing}
  keyExtractor={item => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={21}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>
```

---

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

**Last Updated:** 2025-12-13
**Version:** 1.0.0
