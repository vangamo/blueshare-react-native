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

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
