# One Sol: Memecoin Market Simulator

An educational mobile game that teaches chart pattern recognition using real historical cryptocurrency market data. Predict whether tokens will "RUN" or "RUG" based on partial price charts.

## 📱 Overview

One Sol is a React Native mobile app built with Expo that simulates cryptocurrency trading scenarios. Players analyze historical price charts and predict market outcomes, competing for accuracy on a daily leaderboard. **100% simulated** — no real money, wallets, or transactions involved.

## ✨ Features

- **Chart Pattern Recognition**: Analyze real historical price charts from actual memecoin markets
- **Endless Mode**: Continuous gameplay with progressively challenging scenarios
- **Daily Leaderboard**: Compete for accuracy with daily resets
- **Daily Contest with Real Prizes**: Win 50% of daily trading fees from the official $ONESOL token
- **Email Integration**: Add your email to be eligible for daily prizes
- **Secure User Management**: Device-based authentication with friendly name generation
- **Trade Tracking**: Prevents replaying the same trades within a day
- **Offline Detection**: Graceful handling of network connectivity issues
- **Onboarding Flow**: User-friendly introduction to the game mechanics

## 🛠 Tech Stack

- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Storage**: Expo SecureStore (device ID, user data)
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **Fonts**: Expo Google Fonts (Horizon)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio (for Android development)
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli` (for production builds)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd apps/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies (if building for iOS):
```bash
cd ios && pod install && cd ..
```

### Environment Setup

Create a `.env` file in the root directory (if needed):
```env
EXPO_PUBLIC_BASE_URL=your_api_base_url
EXPO_PUBLIC_PROXY_BASE_URL=your_proxy_url
```

### Development

Start the development server:
```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Or use Expo CLI:
```bash
npx expo start
```

## 🏗 Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── _layout.jsx        # Root layout with navigation logic
│   ├── index.jsx          # Entry point
│   ├── onboarding/        # Onboarding flow screens
│   ├── consent.jsx        # User consent screen
│   ├── home.jsx           # Main home screen
│   ├── endless/           # Game mode screens
│   │   ├── trade.jsx      # Trading/prediction screen
│   │   ├── result.jsx     # Trade result screen
│   │   └── complete.jsx   # Game completion screen
│   ├── leaderboard.jsx    # Daily leaderboard
│   └── settings.jsx       # User settings & account management
├── utils/
│   ├── gameStore.js       # Zustand store for game state
│   ├── useDeviceId.js     # Device ID & friendly name management
│   └── tradesData.js      # Trade calculation utilities
├── components/            # Reusable components
└── assets/                # Images, fonts, etc.
```

## 🎮 How It Works

1. **Onboarding**: New users go through an introduction explaining the game
2. **Consent**: Users must accept terms before playing
3. **Add Your Email** (Optional but recommended):
   - Navigate to Settings from the home screen
   - Tap on the Email section
   - Enter your email address to be eligible for daily prizes
   - Your email is stored securely and used only for prize notifications
4. **Gameplay**: 
   - View a partial historical price chart
   - Choose bet amount (10%, 25%, 50%, or 100% of balance)
   - Predict: RUN (price goes up) or RUG (price goes down)
   - See the result and P&L calculation
5. **Scoring**: Accuracy and final balance determine leaderboard position
6. **Daily Reset**: Leaderboard and available trades reset at midnight

## 🏆 Daily Contest & Prizes

### How to Enter
1. **Add Your Email**: Go to Settings → Email section and enter your email address
2. **Play the Game**: Compete on the daily leaderboard by achieving the highest score
3. **Win**: The player with the highest score at the end of each day wins the daily prize

### Prize Details
- **Winner Prize**: 50% of daily trading fees from the official $ONESOL token
- **Automatic Distribution**: Winners are automatically emailed with a private key containing their winnings
- **Eligibility**: Only players who have added their email address are eligible to win
- **Daily Reset**: Each day is a fresh competition with a new prize pool

### Important Notes
- You must add your email in Settings to be eligible for prizes
- Winners are notified via email automatically
- Prize distribution happens automatically - no manual claim required
- Contest rules and terms apply - see [Contest Rules](https://1sol.fun/contest-rules) for full details

## 🔐 Security & Privacy

- **Device-based Authentication**: Unique device UUID stored securely
- **SecureStore**: Sensitive data (device ID, email, consent status) encrypted on-device
- **Email Storage**: Email addresses are stored securely and used only for prize notifications
- **Account Deletion**: Complete data removal from device and server
- **Privacy**: See our [Privacy Policy](https://1sol.fun/privacy) for details on data handling

## 📦 Building for Production

### iOS (TestFlight/App Store)

1. Configure EAS Build:
```bash
npx eas-cli build:configure
```

2. Create production build:
```bash
npx eas-cli build --platform ios --profile production
```

3. Submit to App Store Connect:
```bash
npx eas-cli submit --platform ios --latest
```

### Build Configuration

- **Build Number**: Auto-incremented by EAS
- **Version**: Managed in `app.json`
- **Credentials**: Managed by EAS (Expo-managed)

## 🔧 Key Features Explained

### Trade Tracking
- Tracks used trade IDs in SecureStore
- Prevents replaying the same trade within a day
- Daily reset at midnight (local time)

### Friendly Names
- Auto-generated on first launch (e.g., "SwiftTiger123")
- Stored securely on device
- Displayed on leaderboard instead of UUID

### Error Handling
- Network connectivity detection
- Graceful degradation when trades exhausted
- User-friendly error messages

## 📝 Scripts

- `npm run ios` - Run on iOS Simulator
- `npm run android` - Run on Android Emulator
- `npm run postinstall` - Apply patches (runs automatically after install)

## 🐛 Troubleshooting

### Metro bundler cache issues
```bash
npx expo start --clear
```

### iOS build issues
```bash
cd ios && pod install && cd ..
```

### EAS build failures
- Check `.easignore` for excluded files
- Verify environment variables are set
- Ensure `app.json` configuration is valid

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contributing guidelines if applicable]

## 📞 Support

- FAQ: https://1sol.fun/faq
- Contact: https://1sol.fun/contact
- Privacy Policy: https://1sol.fun/privacy

---

## ⚠️ Important Disclaimers

**Educational Purpose**: This app is designed for educational and entertainment purposes only. All market activity, trades, balances, profits, and losses displayed in the app are **simulated** and use **virtual funds**. No real cryptocurrency, money, or financial assets are involved in the gameplay.

**Contest Prizes**: While the daily contest offers real prizes (50% of daily trading fees from the official $ONESOL token), the gameplay itself remains 100% simulated. Winners receive prizes via email with a private key containing their winnings.

**Not Financial Advice**: Nothing in this app constitutes financial, investment, or trading advice. Any outcomes shown are hypothetical and based on historical data for educational purposes only.

For full contest rules and terms, visit: https://1sol.fun/contest-rules
