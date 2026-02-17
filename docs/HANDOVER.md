# LegacyLink – Handover guide for successors

This document is for someone who has been given access to a LegacyLink vault (e.g. after the original maintainer is no longer available). It explains what LegacyLink is and how to use it.

## What is LegacyLink?

LegacyLink is an app that stores **encrypted documentation** about technical systems (servers, NAS, VPS, logins, billing) so that someone else can take over later. Everything is stored **locally** in the browser and **encrypted** with a key that only you (or the person who set it up) should have.

## What you need

1. **The app**: The same LegacyLink instance the person used (same URL, or the same self-hosted copy).
2. **The decryption key**: A passphrase or key they used to lock the vault. They should have left it in a safe place (e.g. safe, lawyer, family member). **Without this key, the data cannot be recovered.**
3. **Optional**: A **passkey** (e.g. their device or authenticator) if they set one up. Then you can unlock with that instead of typing the key.

## How to open the vault

1. Open the LegacyLink app in a modern browser (Chrome, Firefox, Edge, Safari).
2. Enter the **decryption key** they gave you and click **Unlock**.
   - If a passkey was set up and you have access to it, you can click **Unlock with passkey** instead.
3. You will see a list of **entries** (documented systems). Open any entry to read what was documented: access details, passwords (masked), locations, IPs, billing info, etc.

## Backing up the vault

1. After unlocking, go to **Export / Import** (from the entries list).
2. Click **Download backup**. This saves an encrypted file. **Keep this file safe.**
3. You need the **same decryption key** to open this file on another device or restore it later. Store the key and the backup in a safe place (e.g. safe, password manager only you can access).

## Adding or changing a passkey

If you have unlocked the vault and want to use a passkey on your own device:

1. Go to **Export / Import**.
2. In the **Passkey** section, click **Register passkey**.
3. Follow the browser prompts to create a passkey (e.g. fingerprint or device PIN). After that, you can unlock with this passkey.

## Important

- **Do not lose the decryption key.** Without it, the vault (and any exported backup) cannot be decrypted.
- **Keep a backup.** Use Export to download an encrypted backup and store it somewhere safe with the key.
- **Use a secure device.** Unlock and view the vault only on a device you trust.

If you have questions about a specific system documented in an entry, use the contact or location details recorded in that entry.
