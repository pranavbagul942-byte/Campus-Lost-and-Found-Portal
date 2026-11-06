# CampusFind — Campus Lost & Found Portal

A responsive campus lost-and-found portal built with HTML, CSS, JavaScript, Firebase Authentication (anonymous), Cloud Firestore and Firebase Storage.

## Features
- Report a lost or found item with description, category, campus location and date
- Optional item photo upload
- Live report board with search and filters
- Contact poster by email
- Responsive layout for desktop and mobile

## Project files
- `index.html` — page structure
- `css/style.css` — responsive design
- `js/app.js` — Firebase connection and app logic
- `firestore.rules` — database access rules
- `storage.rules` — image upload rules

## Firebase setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Register a Web app and copy its Firebase config.
3. Enable **Authentication → Sign-in method → Anonymous**.
4. Create a **Cloud Firestore** database.
5. Create a **Storage** bucket.
6. Paste the Web app config into `firebaseConfig` in `js/app.js`.
7. Publish the contents of `firestore.rules` in Firestore Rules.
8. Publish the contents of `storage.rules` in Storage Rules.

> The Firebase web config is intended to be used in client apps. Protect your project with the included rules, and review usage limits and billing before public launch. The contact email entered in a report is displayed publicly on the board.

## Run locally
Because this project uses JavaScript modules, open it through a local web server (for example, VS Code Live Server). Opening `index.html` directly as a `file://` URL may not work.

## Deploy
You can deploy the static frontend with GitHub Pages after Firebase is configured:
- Push the project files to a GitHub repository.
- In repository Settings → Pages, choose the `main` branch and `/ (root)`.
- Save and wait for the published URL.

#created by Pranav Bagul