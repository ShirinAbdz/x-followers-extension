<p align="center"><b>English</b> | <a href="README.md">فارسی</a></p>

<h1 align="center">🕵️ X Cheaters</h1>

<p align="center">
  <b>Find the people who don't follow you back, and unfollow them.</b><br>
  Without touching verified or high-follower accounts.
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Dependencies" src="https://img.shields.io/badge/Dependencies-0-brightgreen">
  <img alt="Vanilla JS" src="https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=black">
</p>

---

## ✨ What does it do?

After a while, your Following list fills up with people who never followed you back.
Cleaning it by hand means dozens of clicks. This extension walks through your Following list, finds the accounts that don't follow you, and unfollows them, **but only if they match the rules you set**.

### Features

- 🔎 Automatically finds accounts that **don't follow you back** (via the "Follows you" indicator, independent of X's interface language)
- ✅ **Skips verified accounts** (checks both the badge next to the name and the hover card)
- 👥 Only unfollows accounts with **fewer followers than your limit** (default 1000)
- 🛡 **Whitelist** for usernames that must never be unfollowed
- 🔢 **Cap on unfollows** per run (default 40)
- ⏱ **Random delay** between unfollows (default 5 to 12 seconds)
- 📜 **Live log** in the popup: who was unfollowed, who was skipped and why
- ⏹ **Stop** button, any time
- 💾 **Settings are saved** automatically
- 🔒 **No server, no data collection**

---

## ⚠️ Read this first

- Automating follows and unfollows **violates X's rules**. If you overdo it, your account may be **rate-limited or temporarily suspended**. Use this extension at your own risk.
- Keep the cap low (for example **40 to 50 accounts per day**) and don't shorten the delay between unfollows.
- Unfollowing a **protected (private)** account can't be undone directly. To follow it again, you'd have to send a request and wait for approval.
- **Test with a small number first** (say 3 to 5 accounts) to make sure it behaves the way you expect.

---

## 📦 Installation

The extension isn't on the Chrome Web Store, so you install it manually. It takes under a minute:

1. Download this project (or extract the zip).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `x-cheaters` folder.
5. Pin the extension icon to your toolbar so it's always handy.

> 💡 Other Chromium-based browsers such as Edge, Brave and Opera should work too.

---

## 🚀 Usage

1. Sign in to X and go to your own Following page:
   `x.com/your-username/following`
2. Click the **X Cheaters** icon to open the popup. (The popup interface and log messages are currently in Persian.)
3. Set your options (described below).
4. Click **Start** and keep the tab open. The extension scrolls and works through the list on its own.
5. Click **Stop** whenever you want.

### Popup settings

| Setting | What it does | Default |
|---------|--------------|:-------:|
| **Max followers** | Only accounts with this many followers or fewer get unfollowed | 1000 |
| **Max unfollows per run** | Stops automatically when this number is reached | 40 |
| **Delay between unfollows** | Random range (min - max) in seconds | 5 to 12 |
| **Whitelist** | Usernames separated by commas, without `@`. These are never unfollowed | empty |

### Who is **not** unfollowed?

| Case | Result |
|------|--------|
| Follows you back | Skipped |
| Verified | Skipped |
| In your whitelist | Skipped |
| More followers than your limit | Skipped |
| Follower count couldn't be read | **Skipped** (to be safe) |

---

## ⚙️ How it works

```
 Following page
      │
      ▼
 1. Each user in the list is checked
    • Has the "Follows you" indicator?  → skip
    • Has the verified badge?           → skip
    • On the whitelist?                 → skip
      │
      ▼
 2. The mouse hovers over their avatar to open the hover card,
    and the follower count and verified status are read from it
      │
      ▼
 3. Rules satisfied? → click the Following button, then confirm the unfollow
      │
      ▼
 4. Random pause, then the next user. When the list ends, it scrolls for more
```

The extension **doesn't talk to X's API** and sends no separate requests. It only does what you'd do with your mouse: it clicks buttons on the page itself.

---

## 🛠 Troubleshooting

<details>
<summary><b>I see "You need to be on the Following page"</b></summary>

The page URL must end with `/following` (for example `x.com/username/following`). The home feed or your profile page isn't enough.

</details>

<details>
<summary><b>I see "Refresh the page"</b></summary>

After installing, the extension is only active in tabs opened or refreshed **afterwards**. Hard-refresh the X page with `Ctrl + Shift + R` and try again.

</details>

<details>
<summary><b>Many accounts are skipped with "follower count couldn't be read"</b></summary>

To see follower counts, the extension has to open the hover card. If the tab is in the background or you're moving the mouse around, it may not open. Keep the tab **visible and active**, and don't move the mouse.

</details>

<details>
<summary><b>It got slow or stopped midway</b></summary>

Browsers throttle timers in background tabs. Keep the X tab active and visible. If no new users are found after 6 scrolls, the extension finishes on its own.

</details>

<details>
<summary><b>X changed its look and it stopped working</b></summary>

The extension depends on X's page structure (`data-testid` attributes), which X changes from time to time. If that happens, the code needs an update.

</details>

---

## 🔐 Privacy

- The extension **does not collect or send any data**.
- It makes no network requests outside X's own page.
- Settings are stored only in your browser's `chrome.storage.local`.
- No servers, analytics or external libraries are involved.
- It's only active on `x.com` and `twitter.com`.

---

## 🗂 Project structure

```
x-cheaters/
├── manifest.json   ← extension config (Manifest V3)
├── popup.html      ← popup layout
├── popup.js        ← popup logic: settings, start/stop, log
├── content.js      ← main logic running on the X page
├── README.md       ← Persian README
└── README.en.md    ← this file
```

The code is **plain JavaScript** with no dependencies and no build step.

### Notes for developers

- Elements are found through `data-testid` attributes, which don't depend on X's interface language (for example `userFollowIndicator`, `icon-verified`, `confirmationSheetConfirm`).
- Follower counts are read from the hover card. Persian/Arabic digits and the suffixes `K`, `M`, `B` and the Persian words for thousand, million and billion are supported.
- The popup sends start/stop commands to the content script with `chrome.tabs.sendMessage` and receives log updates through `chrome.runtime.sendMessage`.

---

## ⚠️ Limitations

- X occasionally changes its page structure, so the extension may need updates.
- It only works on your own Following page (not other people's lists).
- A hover card has to open for every account, so it's rate-limited by design.
- Accounts whose follower count can't be read are never unfollowed.

---

## 🗺 Roadmap

- [ ] A preview list with manual confirmation before unfollowing
- [ ] Exempt recently followed accounts (for example the first 7 days)
- [ ] Export the list of unfollowed accounts
- [ ] Firefox support

---

<p align="center">Made for a cleaner Following list ❤️</p>
