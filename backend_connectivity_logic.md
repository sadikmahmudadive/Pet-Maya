# Project Backend & Connectivity Logic

This document details the backend architecture, data models, and connectivity logic used in the Tail Wagging Pet Care application.

## Core Technologies
- **Platform**: Android (Java)
- **Database**: Firebase Realtime Database (RTDB)
- **Authentication**: Firebase Authentication
- **Messaging**: Firebase Cloud Messaging (FCM)
- **Image Handling**: Glide (with Disk Caching)
- **Network**: `ValueEventListener` for real-time synchronization

---

## Data Models & Database Schema
Data is organized in a NoSQL structure within Firebase Realtime Database.

### 1. Users (`/users/{uid}`)
Stores profile information for Pet Owners, Veterinarians, Groomers, and Admins.
- `name`: Full name of the user.
- `email`: User's primary email.
- `photoUrl`: Link to profile image (Firebase Storage).
- `role`: One of `Pet Owner`, `Veterinarian`, `Grooming`, `Boarding`, or `Admin`.
- `points`: Loyalty points earned through referrals/activity.
- `referralCode`: Unique 6-character code for referrals.
- `fcmToken`: Current device token for push notifications.
- `latitude` / `longitude`: Used for distance-based service discovery.
- `isVerified`: (Boolean) Status for professional accounts.

### 2. Pets (`/pets/{petId}`)
Linked to owners via `ownerID`.
- `petID`: Unique identifier.
- `ownerID`: UID of the user who owns the pet.
- `name`, `type`, `breed`, `age`: Basic pet details.
- `photoUrl`: Image of the pet.

### 3. Appointments (`/appointments/{apptId}`)
Manages the scheduling flow between users and service providers.
- `vetId`: UID of the provider.
- `ownerId`: UID of the pet owner.
- `petId`: ID of the pet being treated.
- `date` / `time`: Appointment schedule (ISO format strings).
- `status`: `PENDING`, `CONFIRMED`, `CANCELLED`, or `COMPLETED`.

### 4. Service Records (`/service_records/{recordId}`)
Historical logs of medical, grooming, or boarding events.
- `petId`: Reference to the pet.
- `providerId`: UID of the professional who performed the service.
- `title` / `description`: Details of the service provided.
- `timestamp`: Epoch time of the entry.

---

## Connectivity & State Management Logic

### Real-time Synchronization
The app relies heavily on `addValueEventListener` to ensure the UI updates instantly when database changes occur:
- **MainActivity**: Listens for pet additions and loyalty point updates.
- **VetDashboardActivity**: Live updates for new appointments and rating changes.
- **CartManager**: Local singleton that manages shopping cart state before checkout.

### Notification System
- **App.java**: Initializes a global `NotificationListener` when the app starts.
- **MyFirebaseMessagingService**: Processes background and foreground data messages.
- **EventAlarmReceiver**: Handles local scheduled notifications for pet feeding and medical reminders even when offline.

### Service Discovery & Mapping
- **Location Logic**: Uses `Location.distanceBetween` in `MainActivity` to calculate the distance (in km) between the user and service providers.
- **PetTracker**: Connects to the `/users/{uid}/latitude` stream of the pet (simulated or via hardware) to show movement on a map.

### External AI Integration
- **ChatGptAiHelper**: Encapsulates connectivity logic for OpenAI's API. Used for the AI Scanner and chatbot features to provide pet care advice based on scanned images or text queries.

---

## Key Utility Classes
- `NetworkUtils`: Checks for internet availability and handles offline caching states.
- `NavbarHelper`: Manages navigation logic across all activities, handling role-based visibility (e.g., hiding Admin tabs from Pet Owners).
- `AlarmHelper`: Wraps `AlarmManager` for precise scheduling of pet care tasks.
- `CartManager`: Persistence logic for the shopping cart using a Singleton pattern.

---

## Authentication Flow
1. **Login/Register**: Standard Firebase Email/Password auth.
2. **Post-Auth**: App checks the `role` field in `/users/{uid}`.
3. **Redirection**:
    - `Admin` -> `AdminDashboardActivity`
    - `Veterinarian`/`Grooming` -> `VetDashboardActivity`
    - `Pet Owner` -> `MainActivity`
