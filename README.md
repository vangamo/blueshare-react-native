# BlueShare

**BlueShare** is a mobile application built with **React Native** designed to connect older adults and young people. It provides an accessible, simple, and intergenerational social feed where users can share events, short texts, and photos with their loved ones and close circles.

---

## 🌟 Key Features

- **Cross-Platform & Accessible UI:** Platform-agnostic components designed for high readability, high contrast, and ease of use for senior citizens and youth alike.
- **Dynamic Top Header:** Fixed header featuring a menu button, an interactive app title that doubles as a filter/search bar, and a user profile avatar.
- **Versatile Feed:** Heterogeneous feed that displays three distinct content types:
  - **Events (Highlighted):** Multi-photo horizontal carrousels, event titles, categories, description text, and direct action buttons (Edit / Share).
  - **Text Posts:** Clean text cards for quick updates and thoughts.
  - **Image Posts:** Standalone images with descriptive captions.
- **Fixed Navigation Bar:** Clear text-based navigation buttons for **Timeline**, **Circles**, and **Events**.
- **Floating Action Button (FAB):** Quick-create button (`+`) that toggles an inline creation menu to add new events, text, or images.

---

## 🚀 Implementation Roadmap

- Phase 1: Core Layout & Main Feed
- Phase 2: Circles (Contacts Management)
- Phase 3: User Events Management
- Phase 4: Bluetooth Sharing

---

## 🛠 Tech Stack

- **Framework:** React Native
- **Language:** TypeScript
- **Target Platforms:** Android & iOS

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

BlueShare runs on Android and iOS (portrait only). From the dev server output you can open it in:

- [Expo Go](https://expo.dev/go) on a phone (scan the QR code)
- an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/) or [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

Screens live in **src/app** ([file-based routing](https://docs.expo.dev/router/introduction)); shared components, hooks and the theme live in **src/components**, **src/hooks** and **src/constants**.

## Checks

```bash
npm run lint        # ESLint (must pass with no warnings)
npx tsc --noEmit    # type check
npm test            # unit tests (Jest + React Native Testing Library)
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
