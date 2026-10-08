# Installing a signature

Open `dist/index.html` (after `node build.mjs`), find the person, press **Copy signature**, then paste it into the signature box below. The logo is a hosted image, so it needs an internet connection the first time.

## Gmail (web)
Settings (gear), See all settings, General, Signature. Create new, name it, paste, set "Signature defaults" for new mail and replies, Save changes at the bottom.

## Apple Mail (Mac)
Mail, Settings, Signatures. Pick the account, press +, paste. Untick "Always match my default message font" so the formatting stays.

## Outlook (new Outlook and web)
Settings (gear), Accounts, Signatures. New signature, paste, set defaults, Save.

## Outlook (classic desktop, Windows)
File, Options, Mail, Signatures. New, paste into the editor, set defaults, OK.

## iPhone and iPad
Mail apps on iOS only keep a signature as plain text unless you paste rich text first. Settings, Apps, Mail, Signature. Paste the plain-text version from `dist/<brand>/<person>.txt`. If you want the full design on a phone, send yourself a message from a desktop and reply from it, or use Gmail or Outlook for iOS (both support pasted rich signatures).

## Android
Gmail app: Settings, your account, Mobile Signature. It is plain text, so use the `.txt` version.

## Check it
Send a test to yourself and to a Gmail or Outlook address. If the logo does not show, the sender's mail app is blocking images until they allow them. The text still carries everything.
