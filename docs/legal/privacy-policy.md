# Privacy Policy for FitSnapshot

**Effective date:** 1 August 2026
**Last updated:** 1 August 2026

This Privacy Policy explains how **FitSnapshot** ("the App", "we", "us") collects, uses, and protects your information. It applies to the FitSnapshot mobile application published under the package name `com.ledsav.fitsnapshot`.

The App is operated by **Alberto Valdes Rey** ("the Developer").
Contact: **fitsnapshot.help@gmail.com**

---

## 1. Summary (the short version)

FitSnapshot is a **private, local-first** progress-photo tracker.

- Your progress photos and their metadata (date, body angle) are stored **only on your device**. We do **not** upload them to our servers for storage, and we cannot see them.
- We only send data off your device in two cases: (a) when **you choose to generate a GIF**, and (b) to **sign in and process a purchase**. Both are described below.
- We do **not** sell your data, show ads, or use your photos to train any model.

---

## 2. Information we collect

### 2.1 Photos and progress data (stored locally only)
When you take or import a photo, the App stores the image and its metadata (a generated ID, the date, and the body angle: front / side / back) in your device's local storage. This data:
- stays on your device,
- is **not** transmitted to us for storage,
- is deleted when you delete the photo in the App or uninstall the App.

### 2.2 GIF generation (processed when you request it)
The "before/after GIF" feature is optional. **When you choose to generate a GIF**, the specific photos you select are sent to our cloud service (a Google Cloud Function) solely to render the animated GIF, which is then returned to your device. These images are processed entirely in memory to build the GIF and are **not stored, logged, or used for any other purpose** — they are **not retained after the GIF is generated**. The only information saved by this service is a timestamp of your last GIF generation, linked to your account identifier, which we use to enforce the fair-use limit described in Section 2.3.

### 2.3 Account / sign-in
Generating a GIF requires signing in. We use **Google Sign-In** with **Firebase Authentication** (a Google service). When you sign in, we receive and process:
- your Google account identifier and email address,
used to authenticate you and to enforce fair-use limits on the GIF feature (currently one GIF per week per user). We do not receive your Google password.

### 2.4 Purchases and subscriptions
If you buy FitSnapshot Premium, the purchase is processed by **Google Play Billing** and managed through **RevenueCat** (our subscription-management provider). We and RevenueCat receive purchase status information (e.g. whether you have an active subscription, product ID, purchase and expiry dates, and an anonymous app-user identifier). We do **not** receive or store your full payment-card details — those are handled entirely by Google Play.

### 2.5 Device permissions
The App requests these permissions; each is used only for its stated feature:
- **Camera** — to take progress photos.
- **Photos / Media library** — to import an existing photo and to save exported photos/GIFs.
- **Notifications** — to send you optional local reminders to take your photo. Reminders are scheduled on your device.

### 2.6 Information we do **not** collect
We do not collect your contacts, location, or browsing history, and — in the current version — the App does not run third-party advertising or behavioral-analytics tracking. _[If you later add analytics or crash reporting such as Firebase Analytics or Sentry, update this section before that version ships.]_

---

## 3. How we use information

We use the limited information above to:
- provide the core features you request (capture, compare, streaks);
- generate GIFs when you ask;
- authenticate you and apply fair-use limits;
- process and restore your purchases;
- send reminders you have enabled;
- maintain the security and integrity of the service.

We do **not** sell your personal information, and we do **not** use your photos for advertising or model training.

---

## 4. Legal bases for processing (EEA/UK users)

Where the GDPR or UK GDPR applies, we rely on:
- **Performance of a contract** — to provide features you request (sign-in, GIF generation, purchases);
- **Consent** — for notifications and device permissions, which you can grant or revoke at any time in your device settings;
- **Legitimate interests** — to keep the service secure and prevent abuse of the GIF feature.

---

## 5. Sharing and third parties

We share data only with service providers that make the App work:

| Provider | Purpose | Data involved |
|---|---|---|
| Google (Firebase Authentication, Cloud Functions, Google Sign-In) | Authentication and GIF generation | Account identifier/email; images you submit for a GIF |
| RevenueCat | Subscription management | Purchase status, anonymous user ID |
| Google Play Billing | Payment processing | Handled by Google; we do not receive card data |

These providers process data under their own privacy policies. We do not sell data to, or share it with, advertisers or data brokers.

---

## 6. Data retention and deletion

- **Photos and progress data:** retained locally until you delete them in the App or uninstall the App. You are in control.
- **Account data:** retained while your account is active. See "How to delete your account" below.
- **Purchase records:** retained as required for accounting, tax, and to honor active subscriptions.

### 6.1 How to delete your FitSnapshot account and data

To request deletion of your FitSnapshot account and the associated data held by Alberto Valdes Rey (the Developer), follow these steps:

1. Email **fitsnapshot.help@gmail.com** with the subject line **"Delete My Account"**.
2. Include the Google account email address you used to sign in to FitSnapshot, so we can locate your account.
3. We will process your request and confirm by email within **30 days**.

**What gets deleted:** your Firebase authentication account and associated email/identifier, and your subscription-identity record held by our subscription-management provider (RevenueCat).

**What is retained, and why:** purchase/transaction records may be retained for a limited additional period after deletion, where required for accounting, tax, and legal-compliance purposes. Your progress photos are never stored on our servers in the first place — they exist only on your device, so there is nothing for us to delete on our end; uninstalling the App or deleting photos within it removes them immediately and completely.

---

## 7. Security

Data on your device is protected by your device's own security (lock screen, OS sandboxing). Data in transit to our providers is encrypted using industry-standard TLS. No method of storage or transmission is 100% secure, but we take reasonable measures to protect your information.

---

## 8. Children's privacy

FitSnapshot is not directed to children under 13 (or the minimum age of digital consent in your country). We do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.

---

## 9. Your rights

Depending on where you live, you may have the right to access, correct, delete, or export your personal data, to object to or restrict processing, and to withdraw consent. Because most of your data lives only on your device, you can exercise many of these rights directly in the App (delete photos, revoke permissions, sign out). For requests concerning account or purchase data, contact us at **fitsnapshot.help@gmail.com**. EEA/UK users also have the right to lodge a complaint with their local data-protection authority.

---

## 10. International transfers

Our providers (Google, RevenueCat) may process data on servers located outside your country, including the United States. Where required, these transfers are covered by appropriate safeguards such as Standard Contractual Clauses.

---

## 11. Changes to this policy

We may update this Privacy Policy from time to time. We will revise the "Last updated" date above and, for material changes, provide notice within the App. Continued use of the App after changes take effect constitutes acceptance.

---

## 12. Contact

Questions about this policy or your data:
**fitsnapshot.help@gmail.com**
