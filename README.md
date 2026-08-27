# Pet Maya 🐾

Pet Maya is a premium, all-in-one pet care platform built with Flutter and Firebase. It offers a sophisticated ecosystem for pet owners, veterinarians, and service providers.

## 🚀 Key Features

### 🦴 Core Ecosystem
- **Digital Health Vault**: Secure storage for pet medical history, vaccinations, and allergies.
- **AI Health Scanner**: Vision AI diagnostic tool for instant symptom insights (powered by OpenAI).
- **Service Marketplace**: Book verified veterinarians, groomers, and boarding facilities.
- **Premium Shop**: Integrated e-commerce experience with "Buy Now" flow and dynamic delivery pricing.

### 🏘️ Community & Content
- **Community Feed**: Share moments, adoption posts, and rescue alerts with fellow pet lovers.
- **Pet Care Blog**: Expert articles and community-contributed content on pet health and lifestyle.
- **Dynamic Reviews**: 100% data-driven rating system for products and service providers.

### 🛡️ Admin & Security
- **Master Console**: Centralized command center for managing users, shop inventory, and editorial content.
- **Broadcast System**: Real-time push notifications (FCM) and persistent system-wide alerts.
- **Secure Storage**: On-device image compression and unified Firebase Storage with strict security rules.
- **Performance Monitoring**: Integrated Firebase Performance Monitoring for optimized app speed and rendering.

## 🛠️ Technical Stack
- **Framework**: Flutter (Multi-platform)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions, Messaging)
- **AI**: OpenAI GPT-4o integration via Cloud Functions
- **State Management**: Provider
- **Theme**: Premium Clinical Design (Light & Dark Mode support)

## 🏁 Getting Started

1.  **Environment Setup**:
    - Ensure you have the Flutter SDK installed.
    - Create a `.env` file in the root directory for local configurations.
2.  **Firebase Configuration**:
    - Project is pre-configured with `firebase_options.dart`.
    - Run `firebase deploy --only functions,firestore:rules,storage` to sync backend logic.
3.  **Run the App**:
    ```powershell
    flutter run
    ```

---
*Developed with ❤️ for pet health and wellness.*
