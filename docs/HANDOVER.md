# LegacyLink – Handover guide for successors

This document is for someone who has been given access to a LegacyLink vault (e.g. after the original maintainer is no longer available). It explains what LegacyLink is and how to use it.

## What is LegacyLink?

LegacyLink is an app that stores **encrypted documentation** about technical systems (servers, NAS, VPS, logins, billing) so that someone else can take over later. Everything is stored in a **single encrypted vault file**. You open that file in the app and unlock it with a decryption key.

## What you need

1. **The app**: The same LegacyLink instance the person used (same URL, or the same self-hosted copy).
2. **The vault file**: The `.json` file that contains the encrypted vault. They should have left it in a safe place (e.g. safe, lawyer, family member).
3. **The decryption key**: The passphrase or key they used to lock the vault. **Without this key, the data cannot be recovered.**

## How to open the vault

1. Open the LegacyLink app in a modern browser (Chrome, Firefox, Edge, Safari).
2. Click **Import vault** and choose the vault file (the `.json` file they gave you).
3. Enter the **decryption key** they gave you and click **Open vault** (or **Unlock**).
4. You will see a list of **entries** (documented systems). Open any entry to read what was documented: access details, passwords (masked), locations, IPs, billing info, etc.

## Backing up or moving the vault

1. After unlocking, go to **Successor Key** in the sidebar (or **Vault file** / **Export / Import** depending on the app version).
2. **Save a copy as…** lets you save an encrypted copy to another file you choose (recommended in supported browsers).
3. Or use **Download backup** to save a copy to your downloads folder.
4. **Open another vault** replaces the current vault with a different vault file (e.g. an older backup). Use the same decryption key for that file.
5. Keep the vault file and the decryption key in a safe place (e.g. safe, password manager only you can access).

## Settings and version history

- **Settings** lets you set your AKA (nickname) and how many **versions** of the vault to keep in the file (more versions mean a larger file).
- If version history is enabled, **History of versions** in Settings lists past snapshots; you can **Restore** one to roll back the vault to that state.

## Important

- **Do not lose the decryption key.** Without it, the vault (and any copy of the file) cannot be decrypted.
- **Keep a backup.** Save a copy of the vault file and store it somewhere safe with the key.
- **Use a secure device.** Unlock and view the vault only on a device you trust.

If you have questions about a specific system documented in an entry, use the contact or location details recorded in that entry.
