# My own personal notes

## Install

Create de app basis:

```
npx create-expo-app@latest
```

And give a name for de apk (without spaces and symbols other than -)

---

Then, to run the apk:

```
mv apk-name/* .
mv apk-name/.* .
# Or
cd apk-name

## Then, run web version:
npm run web

# Or run Android version
npm run android
```

To develop and implement an Android version you will need Android SDK or you'll receive this message:

```
› Opening on Android...
Failed to resolve the Android SDK path. Default install location not found: /home/vangamo/Android/Sdk. Use ANDROID_HOME to set the Android SDK location
```
