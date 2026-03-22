# 🏰 Tower Defense Game

A browser-based tower defense game built with [Phaser 3](https://phaser.io/). No install required — just open `index.html` or deploy to GitHub Pages.

---

## 🎮 How to Play

1. **Place towers** by clicking a tower type in the right panel, then clicking an empty green tile
2. **Upgrade towers** by clicking a placed tower → Upgrade button
3. **Sell towers** for 60% of your investment
4. **Survive all 15 waves** without losing 20 lives

---

## 🗼 Towers

| Tower  | Cost | Special |
|--------|------|---------|
| Archer | 50g  | Fast attack, balanced damage |
| Cannon | 100g | Slow but devastating — splash AoE |
| Frost  | 75g  | Slows enemies significantly |
| Tesla  | 125g | Chains lightning to nearby enemies |

Each tower has **3 upgrade levels** (+damage, +range).

---

## 👾 Enemies

| Enemy  | Trait |
|--------|-------|
| Grunt  | Standard foot soldier, swarms in groups |
| Runner | Blazing fast, very low HP |
| Brute  | Slow but absorbs enormous punishment |

---

## 🚀 Running Locally

Just open `index.html` directly in any modern browser — **no server needed**.

## 🌐 GitHub Pages Deployment

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Your game will be live at `https://your-username.github.io/tower-defense-game/`

---

## 🗂️ Project Structure

```
tower-defense-game/
├── index.html              ← Entry point (open this to play)
├── src/
│   ├── config.js           ← All game constants, tower/enemy/wave data
│   ├── main.js             ← Phaser game config & boot
│   ├── entities/
│   │   ├── Enemy.js        ← Enemy movement, health, rendering
│   │   ├── Projectile.js   ← Bullet logic (splash, chain, slow)
│   │   └── Tower.js        ← Tower targeting, firing, upgrading
│   └── scenes/
│       ├── MenuScene.js    ← Start screen
│       ├── GameScene.js    ← Core gameplay loop
│       └── UIScene.js      ← HUD panel (gold, lives, shop, info)
└── README.md
```

---

## 🛠️ Tech Stack

- **Phaser 3.60** — game framework (loaded from CDN)
- **Vanilla JS** — no build tools, no npm
- **Canvas API** — all graphics drawn programmatically (no image files needed)

---

Built with ❤️ using Claude
