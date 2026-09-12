# 🎂 Interactive Birthday Journey Website

A magical, interactive, and shareable birthday celebration website. Built with modern web technologies, smooth animations, procedural Web Audio soundtrack and SFX, interactive 3D birthday cake with candle-blowing mechanics, Polaroid memory lightbox wall, secret wax-sealed letter, and live link generator.

---

## ✨ Key Features & Flow

1. 🎈 **Welcome Curtain**:
   - Floating 3D glossy balloons with strings and pop-on-click physics.
   - Ambient glowing backdrop and "✨ Open Your Surprise" gateway.
2. 🎉 **The Grand Birthday Reveal**:
   - Personalized dynamic name heading (*"Happy Birthday, [Name]!"*).
   - Multi-cannon confetti explosion + atmospheric canvas fireworks.
3. ❤️ **Heartfelt Personal Note**:
   - Ambient typewriter effect with realistic punctuation cadence.
4. 📸 **Polaroid Memory Wall**:
   - Realistic tape/pin aesthetic cards with tilt on hover and interactive lightbox modal.
5. 🎂 **Interactive 3D Birthday Cake**:
   - 3-tier celebration cake with flickering candles.
   - Interactive candle extinguishing on tap/click with realistic blow sound, smoke particle puffs, celebratory fanfare, and *"Make a wish! ✨"* banner.
6. 💌 **Secret Wax-Seal Letter**:
   - Interactive 3D envelope with golden wax seal stamp. Tap to break the seal, open the flap, and slide out the secret heartfelt note.
7. 🌟 **Grand Finale & Wishes**:
   - Fireworks celebration sky with wishing cards.
8. 🎁 **Live Link Generator & Share**:
   - Built-in modal to generate personalized URLs with custom recipient name, sender name, and secret message.
   - 1-click WhatsApp, Telegram, and Copy Link sharing.
9. 🎵 **Procedural Web Audio Engine**:
   - Zero broken external MP3 dependencies: Synthesizes "Happy Birthday" melody and SFX (pops, whooshes, chimes, cheers) directly via Web Audio API.

---

## 🔗 Shareable URL Parameters

You can customize the celebration simply by appending query parameters to the URL:

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `name` | Recipient's name | `?name=Priya` |
| `from` | Sender's name / nickname | `?from=Rahul` |
| `msg` | Secret message inside the envelope | `?msg=Thank+you+for+always+being+my+best+friend!` |

**Example Share Link:**
```
https://your-birthday-site.vercel.app/?name=Priya&from=Rahul&msg=Best+wishes+for+an+amazing+year!
```

---

## 🚀 How to Run Locally

1. Simply open `index.html` in any modern web browser:
   - Double click `index.html`, or
   - Use VS Code Live Server / Python HTTP Server (`python -m http.server 3000`).

---

## 🌐 Free Deployment to Vercel

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Birthday Journey website"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository and click **Deploy**.
4. Share your live `.vercel.app` URL with your loved ones! 🎈
