/**
 * Birthday Journey - Master Multi-Language Interactive Controller
 * Supports English, Hindi (हिंदी), and Marathi (मराठी)
 * Features: Clean Encoded URLs (no names in URL), Dynamic Memories Stage,
 * Multi-app sharing (WhatsApp, Telegram, Instagram, SMS, Native Share, Copy Link),
 * and rich deterministic wishes tailored for each person!
 */

document.addEventListener('DOMContentLoaded', () => {
    let currentStageIndex = 0;
    let currentLanguage = 'en';
    let candlesBlown = false;
    let envelopeOpened = false;

    // XOR Scramble Key so no plaintext or readable names exist anywhere in generated URLs
    const CIPHER_KEY = [0x5b, 0x8c, 0x3d, 0x9f, 0x24, 0x71, 0xa5, 0x6e, 0x17, 0xf3];

    function xorTransform(bytes) {
        const result = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            result[i] = bytes[i] ^ CIPHER_KEY[i % CIPHER_KEY.length];
        }
        return result;
    }

    // Helper: Encrypted URL-safe Base64 Encoding and Decoding for Clean URLs (No plaintext names in URL)
    function encodeWishPayload(data) {
        try {
            const compact = [data.r || '', data.s || '', data.l || 'en', data.m || ''];
            const jsonStr = JSON.stringify(compact);
            const utf8Bytes = new TextEncoder().encode(jsonStr);
            const encryptedBytes = xorTransform(utf8Bytes);
            let binary = '';
            for (let i = 0; i < encryptedBytes.byteLength; i++) {
                binary += String.fromCharCode(encryptedBytes[i]);
            }
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        } catch(e) {
            return '';
        }
    }

    function decodeWishPayload(encoded) {
        if (!encoded) return null;
        try {
            let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            const binary = atob(base64);
            const rawBytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                rawBytes[i] = binary.charCodeAt(i);
            }
            const decryptedBytes = xorTransform(rawBytes);
            const jsonStr = new TextDecoder().decode(decryptedBytes);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
                return {
                    r: parsed[0] || null,
                    s: parsed[1] || null,
                    l: parsed[2] || 'en',
                    m: parsed[3] || null
                };
            } else if (parsed && typeof parsed === 'object') {
                return parsed;
            }
            return null;
        } catch (e) {
            // Fallback legacy decoding if needed
            try {
                let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
                while (base64.length % 4) base64 += '=';
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const jsonStr = new TextDecoder().decode(bytes);
                return JSON.parse(jsonStr);
            } catch (err) {
                return null;
            }
        }
    }

    // Helper: Safe URL Parameter Decode
    function safeDecode(val, fallback) {
        if (val === null || val === undefined) return fallback;
        try {
            const decoded = decodeURIComponent(String(val).replace(/\+/g, ' ')).trim();
            return decoded.length > 0 ? decoded : fallback;
        } catch (e) {
            return fallback;
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const encodedParam = urlParams.get('w');
    const urlPayload = encodedParam ? decodeWishPayload(encodedParam) : null;

    const urlRecipient = urlPayload ? urlPayload.r : safeDecode(urlParams.get('to') || urlParams.get('name') || urlParams.get('recipient'), null);
    const urlSender = urlPayload ? urlPayload.s : safeDecode(urlParams.get('from') || urlParams.get('sender') || urlParams.get('by'), null);
    const urlLang = urlPayload ? urlPayload.l : safeDecode(urlParams.get('lang'), null);
    const urlMsg = urlPayload ? urlPayload.m : safeDecode(urlParams.get('msg'), null);

    // Is this a direct shared personalized wish link?
    const isSharedWish = Boolean(urlRecipient || (urlPayload && urlPayload.r));

    // Retrieve stored sender/receiver data ONLY if this is a direct shared wish or stored custom wish
    let storedWish = null;
    try {
        const rawStored = localStorage.getItem('birthday_user_wish');
        if (rawStored) storedWish = JSON.parse(rawStored);
    } catch (e) {}

    let recipientName = urlRecipient || (isSharedWish && storedWish && storedWish.to) || '';
    let senderName = urlSender || (isSharedWish && storedWish && storedWish.from) || '';
    let customMsg = urlMsg !== null ? urlMsg : ((isSharedWish && storedWish && storedWish.msg) || null);

    if (urlLang && ['en', 'hi', 'mr'].includes(urlLang)) {
        currentLanguage = urlLang;
    } else if (isSharedWish && storedWish && storedWish.lang && ['en', 'hi', 'mr'].includes(storedWish.lang)) {
        currentLanguage = storedWish.lang;
    }

    let inGeneratorView = !isSharedWish;

    if (isSharedWish) {
        // Persist active names to localStorage so receiver never loses them upon refresh
        try {
            localStorage.setItem('birthday_user_wish', JSON.stringify({
                to: recipientName,
                from: senderName,
                msg: customMsg,
                lang: currentLanguage
            }));
        } catch (e) {}

        // Clean address bar so NO parameters or names are shown in the browser URL bar
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Trigger celebration effects initially on load for receiver
        setTimeout(() => {
            if (window.confettiFX) {
                window.confettiFX.cannon(true);
                setTimeout(() => window.confettiFX.cannon(false), 300);
            }
        }, 400);
    }

    // =========================================================================
    // CUSTOM MEMORIES PHOTOS STATE
    // =========================================================================
    let customPhotos = [];
    try {
        const storedPhotos = localStorage.getItem('birthday_custom_photos');
        if (storedPhotos) customPhotos = JSON.parse(storedPhotos);
    } catch(e) {}

    // =========================================================================
    // MULTI-LANGUAGE & MULTI-TAB RICH LOVELY CONTENT DICTIONARY
    // =========================================================================

    const contentDictionary = {
        en: {
            toLabel: '🎁 TO:',
            fromLabel: 'With All My Love & Best Wishes From',
            mainHeading: (recip) => `Happy Birthday, ${recip}!`,
            mainTagline: 'Wishing you the most magical, joyful, and sweetest day! 🎉',
                        mainWishes: [
                (recip, sender) => "Happy Birthday, " + recip + "! 🎉 Another year wiser, bolder, and undeniably cooler! May your day be packed with endless laughter, extra cake, and zero worries. Cheers from " + sender + "! 🥳",
                (recip, sender) => "Hip hip hooray for " + recip + "! 🎂 May your special day bring you all the fun, surprises, and happiness you can handle. Keep being the rockstar you are! From " + sender + " ✨",
                (recip, sender) => "Happy Birthday to the legendary " + recip + "! 🎈 Warning: high levels of fun, music, and cake expected today! Wishing you a sensational day, from " + sender + "! 🍰",
                (recip, sender) => "It's " + recip + "'s day to shine brighter than a disco ball! ✨ Hope your birthday is as upbeat, fun, and wonderful as your personality. Cheers, " + sender + " 🍕",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎁 Eat all the treats, dance like nobody is watching, and celebrate in grand style. Sending you top-tier birthday vibes, " + sender + "! 🕺",
                (recip, sender) => "Time to pop the confetti for " + recip + "! 🎊 May this year bring you epic road trips, belly laughs, and unmatched good times. High five from " + sender + "! 🚀",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 May your day be 100% stress-free, 100% fun-filled, and 1000% memorable. Big celebration hugs from " + sender + "! 🎉",
                (recip, sender) => "To the coolest person in the room, Happy Birthday " + recip + "! 🕶️ May your inbox be quiet, your playlist be fire, and your cake be huge. Always cheering for you, " + sender + "! ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🥳 Here is your official permission to eat dessert first and celebrate all day long! Warm wishes and big smiles from " + sender + " 🧁",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎈 Life is so much more fun with your cheerful energy around. May your year ahead be packed with endless joy, from " + sender + "! 🌈",
                (recip, sender) => "Another 365 days of being awesome, " + recip + "! 🎂 Wishing you heaps of laughter, delicious food, and wonderful company today. From " + sender + " with love! 🎁",
                (recip, sender) => "Happy Birthday, superstar " + recip + "! 🌟 May your day overflow with epic moments, good music, and sweet surprises. Cheers from " + sender + " 🍾",
                (recip, sender) => "Sending giant birthday cheers to " + recip + "! 🎉 May your new age unlock fantastic adventures and endless reasons to smile. Your buddy, " + sender + "! 🚀",
                (recip, sender) => "Happy Birthday, " + recip + "! 🍰 May your candles burn bright and all your fun wishes come true in an instant. From " + sender + " with great joy! 🎈",
                (recip, sender) => "Happy Birthday to the one and only " + recip + "! 🎊 Today we celebrate your unique sparkle, your humor, and your great heart. Best wishes from " + sender + "! ✨",
                (recip, sender) => "Cheers to " + recip + " on your special birthday! 🥂 May your days ahead be colorful, thrilling, and full of joyful surprises. Warm regards from " + sender + " 💖",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎁 May your celebration be as bright, loud, and fantastic as your spirit! Best wishes always, " + sender + " 🥳",
                (recip, sender) => "Dearest " + recip + ", on this beautiful day, I celebrate the light and warmth you bring into every life you touch. May peace, love, and fulfillment surround you always. With all my heart, " + sender + " ❤️",
                (recip, sender) => "Happy Birthday, dearest " + recip + "! 🌸 Your genuine kindness is a rare gift to this world. May every dream in your heart find its way into reality. Deepest love from " + sender + " ✨",
                (recip, sender) => "To someone truly special, Happy Birthday " + recip + "! 🌟 Thank you for being such an authentic, compassionate, and uplifting presence. May your year overflow with blessings. From " + sender + " ❤️",
                (recip, sender) => "Dearest " + recip + ", watching you grow and flourish is a true joy. May your path ahead be illuminated by love, health, and profound happiness. Always in your corner, " + sender + " 💫",
                (recip, sender) => "Happy Birthday, " + recip + "! 💖 May this milestone bring you quiet peace of mind, deep contentment, and hearts full of love. Cherishing you always, " + sender + " 🌸",
                (recip, sender) => "To the wonderful soul that is " + recip + ", Happy Birthday! 🌿 May life reward all the good you do with boundless joy, great health, and true friendships. Warmest love, " + sender + " ❤️",
                (recip, sender) => "Dearest " + recip + ", you make ordinary moments feel meaningful simply by being there. May your special day bring you as much happiness as you give to others. Love from " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌺 May your heart always remain full of gratitude, your spirit full of courage, and your life full of love. Best wishes from " + sender + " 💖",
                (recip, sender) => "To the dearest " + recip + ", on your birthday I wish you the gentle gift of inner peace, unwavering joy, and heartfelt companionship. Always here for you, " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌷 May you always be surrounded by genuine people, heartwarming laughter, and love that never fades. Warmly wishing you the best, " + sender + " ❤️",
                (recip, sender) => "Dearest " + recip + ", thank you for your warmth, your sincerity, and your listening ear. May this year shower you with all the grace and love you deserve. From " + sender + " ✨",
                (recip, sender) => "Happy Birthday, beautiful soul " + recip + "! 🌸 May your path be lined with serendipity, tender memories, and endless reasons to smile. Lovingly from " + sender + " 💖",
                (recip, sender) => "To my cherished friend " + recip + ", Happy Birthday! 🌟 May every sunrise bring you fresh optimism and every sunset leave you with deep peace. Forever cheering for you, " + sender + " ❤️",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌿 Your presence is a true blessing in my life. May this new year bring you overflowing joy and tranquil comfort. With affection, " + sender + " 💫",
                (recip, sender) => "Dearest " + recip + ", on this special day, I pray for your glowing health, pure happiness, and lasting serenity. Keep shining bright! Warmly, " + sender + " 🌸",
                (recip, sender) => "Happy Birthday, " + recip + "! 💖 May you feel truly appreciated, deeply loved, and celebrated today and every single day. With heartfelt love from " + sender + " ✨",
                (recip, sender) => "To dearest " + recip + ", may your birthday be the start of your most peaceful, rewarding, and heartwarming year yet. Always in my prayers, " + sender + " ❤️",
                (recip, sender) => "To the graceful " + recip + ", Happy Birthday! ✨ Like a gentle sunrise, your spirit brings beauty and calm to all around you. May your year unfold like a tapestry of golden moments. Best wishes, " + sender + " 🌅",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 May the music of laughter, the fragrance of joy, and the glow of good health accompany every step of your journey. With elegance and respect from " + sender + " 🎻",
                (recip, sender) => "To the radiant " + recip + ", may your special day be adorned with quiet blessings, timeless memories, and soaring dreams. Wishing you pure magnificence, " + sender + " 🥂",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌸 May life write its sweetest poetry across the pages of your upcoming year. Warmest regards from " + sender + " 📜",
                (recip, sender) => "To " + recip + ", a soul of grace and poise: Happy Birthday! 💎 May your path be illuminated by stellar achievements and peaceful horizons. Fondly, " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌙 May your life be as radiant as the moonlit ocean, filled with serene wonders and golden tides. Deepest wishes from " + sender + " 🌊",
                (recip, sender) => "To the extraordinary " + recip + ", Happy Birthday! 🕊️ May peace dwell in your heart and prosperity grace your footsteps. With high regard and warm thoughts, " + sender + " 🌿",
                (recip, sender) => "Happy Birthday, " + recip + "! 🕯️ May the coming year be a masterpiece of serendipity, good fortune, and genuine smiles. Best wishes from " + sender + " 🎨",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌟 May your days resonate with harmonious melodies of health, prosperity, and love. Warmest wishes from " + sender + " 🎶",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌸 Like a blooming garden in spring, may your aspirations blossom into magnificent realities. With admiration, " + sender + " 🌷",
                (recip, sender) => "To " + recip + ", wishing you a birthday filled with the quiet luxury of peace, the wealth of health, and the joy of genuine love. From " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 💫 May your footsteps always lead toward gentle wisdom, golden triumphs, and deep contentment. Gratefully, " + sender + " 🌟",
                (recip, sender) => "To the timeless and charming " + recip + ", Happy Birthday! 🥂 May your days ahead shine with unclouded sunshine and blissful laughter. With best wishes from " + sender + " ☀️",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌹 May the universe orchestrate its most delightful surprises for you throughout this new year. Warmest greetings from " + sender + " 🎻",
                (recip, sender) => "To " + recip + ", on this special anniversary of your birth: May beauty surround you and happiness abide with you. From " + sender + " with highest esteem 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 🕊️ May your spirit soar on wings of optimism and your heart remain an oasis of tranquility. Warm wishes from " + sender + " 🌿",
                (recip, sender) => "To the wonderful " + recip + ", may your birthday be the dawn of a year filled with timeless elegance and triumphant joys. Sincerely, " + sender + " 💫",
                (recip, sender) => "Happy Birthday, my friend " + recip + "! 😊 Thanks for all the shared memories and late-night chats. Wishing you the happiest day ever! From " + sender + " 🍕",
                (recip, sender) => "Hey " + recip + ", wishing you an epic birthday filled with your favorite people, good food, and great tunes! Your friend, " + sender + " 🎧",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎉 So grateful to have someone as fun and dependable as you in my circle. Let's make this year unforgettable! Cheers, " + sender + " ☕",
                (recip, sender) => "Big birthday shoutout to " + recip + "! 🎈 May your year ahead be full of successful milestones and stress-free weekends. Best vibes from " + sender + " 🚀",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 Keep being your awesome self and never lose that contagious smile. Your buddy, " + sender + " 😊",
                (recip, sender) => "Wishing the happiest of birthdays to " + recip + "! 🍰 May every coffee be strong, every day be productive, and every weekend be fun! From " + sender + " ☕",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎊 Having you around always makes the world a brighter place. Have a blast today! Cheers from " + sender + " 🍔",
                (recip, sender) => "To my great pal " + recip + ", Happy Birthday! 🎁 May this year bring you great opportunities and endless good times. Always in your corner, " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 🥳 Here is to another year of laughs, shared jokes, and great conversations. Wishing you the best, " + sender + "! 🍻",
                (recip, sender) => "Hey " + recip + "! 🎂 Hope your birthday is filled with everything you love most. You deserve nothing but the best! Your friend, " + sender + " 🎈",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌈 Wishing you 365 days of good news, great wins, and memorable moments. From " + sender + " with a big smile! 🚀",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🎉 Thanks for always being someone I can count on. Have an incredible celebration today! Best wishes from " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🍰 May your year be packed with awesome experiences and unforgettable stories. Your friend, " + sender + " 📖",
                (recip, sender) => "Big cheers to " + recip + " on your special day! 🥂 May all your projects succeed and your dreams take flight. From " + sender + " with excitement! 🎯",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 Keep spreading your positive energy everywhere you go. Celebrating you today, " + sender + "! 😊",
                (recip, sender) => "Wishing you a fantastic birthday, " + recip + "! 🎈 May this new chapter bring you peace, prosperity, and plenty of fun! Your buddy, " + sender + " 🍕",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎊 Here's to good health, big smiles, and another year of winning together. From your pal, " + sender + " 🏆",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 You possess incredible potential and an inspiring drive. May this year take your ambitions to heights you once only dreamed of. Cheering for you, " + sender + " 🚀",
                (recip, sender) => "To the visionary " + recip + ", Happy Birthday! 🎯 Keep chasing your boldest dreams with that unmatched passion. The world is yours to conquer! Best wishes, " + sender + " 💡",
                (recip, sender) => "Happy Birthday, " + recip + "! 🦅 May you have the courage to take big leaps and the resilience to turn every challenge into victory. Always believing in you, " + sender + " ✨",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌌 Every milestone is an open door to greatness. Step boldly into this new year knowing you are capable of wonders. From " + sender + " 💫",
                (recip, sender) => "Happy Birthday, " + recip + "! 🏔️ May you climb every summit you set your eyes on and find deep fulfillment along the way. Your supporter, " + sender + " 🧗",
                (recip, sender) => "To " + recip + ", on your birthday: May your wisdom deepen, your vision expand, and your impact grow stronger every single day. Proud of you, " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 🧭 May your inner compass always guide you toward truth, excellence, and radiant success. From " + sender + " with respect 🎯",
                (recip, sender) => "To the unstoppable " + recip + ", Happy Birthday! ⚡ May this year bring you groundbreaking breakthroughs and triumphant moments. Always cheering for you, " + sender + " 🚀",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 Your dedication is a beacon for everyone around you. May your rewards match your extraordinary efforts! From " + sender + " ✨",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌈 Dream fearlessly, act boldly, and watch how the universe aligns to support you. Believing in your greatness, " + sender + " 💫",
                (recip, sender) => "Happy Birthday, " + recip + "! 🗝️ May this year unlock golden opportunities and lead you to your most victorious achievements. From " + sender + " with admiration 🏆",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🚀 May your focus stay sharp and your enthusiasm stay boundless. You are destined for remarkable things! Your friend, " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 💡 May brilliant ideas flow freely and lead you toward life-changing breakthroughs this year. High regards from " + sender + " 🎯",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌿 May your roots stay grounded in kindness while your branches reach for the stars. Inspiringly yours, " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🦅 Spread your wings and soar above the ordinary. You were made for greatness! From " + sender + " with wholehearted support 🌌",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌟 May your courage never waver and your optimism never fade. Keep writing your inspiring story! Warmly, " + sender + " 📖",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎯 May this year be your masterclass in success, peace, and triumphant accomplishments. Best wishes always, " + sender + " 🏆",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎂 Today is all about celebrating the wonderful gift of YOU! May your day be packed with joy, laughter, and sweet treats. From " + sender + " 🎉",
                (recip, sender) => "Let the grand celebrations begin for " + recip + "! 🥳 Wishing you music that makes you dance, friends that make you laugh, and memories that last forever! Cheers, " + sender + " 🍾",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎈 Blow the candles, make the biggest wish, and get ready for your happiest year yet! Huge love from " + sender + " 🍰",
                (recip, sender) => "To the guest of honor, " + recip + ": Happy Birthday! 🌟 May your special day be overflowing with love, surprise gifts, and vibrant energy. From " + sender + " 🎁",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎊 Today we toast to your health, your laughter, and the wonderful sunshine you bring everywhere. Cheers from " + sender + " 🥂",
                (recip, sender) => "Happy Birthday, superstar " + recip + "! 🍰 May your cake be sweet, your gifts be plenty, and your smile be endless today! Love, " + sender + " 🎈",
                (recip, sender) => "Time for party poppers and sparklers for " + recip + "! 🎆 Wishing you an electrifying birthday celebration filled with joy. Your pal, " + sender + " 🎉",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎂 May the coming year bring you 365 days of vibrant health, joyful celebrations, and good fortune! From " + sender + " ✨",
                (recip, sender) => "To the dearest " + recip + ", Happy Birthday! 🌟 Today the spotlight is on you! Enjoy every magical second of your special day. Best wishes from " + sender + " 🥳",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎁 Wishing you a celebration as grand, delightful, and unforgettable as you are! Warmest hugs from " + sender + " 🎈",
                (recip, sender) => "Pop the bubbles for " + recip + "! 🥂 May this birthday mark the start of your most joyful, blessed, and prosperous year yet. Cheers, " + sender + " 🍰",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎊 May your day be filled with warm hugs, happy memories, and endless laughter. With lots of love, " + sender + " 💖",
                (recip, sender) => "To the wonderful " + recip + ", Happy Birthday! 🎂 Put on your best smile and enjoy the best party of the year! Big cheers from " + sender + " 🎉",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌟 May your special day bring you as much happiness and cheer as you bring to everyone else. From " + sender + " ✨",
                (recip, sender) => "Let the birthday magic begin for " + recip + "! 🎈 Wishing you wonderful moments, heartwarming wishes, and delightful surprises! Your friend, " + sender + " 🎁",
                (recip, sender) => "Happy Birthday, " + recip + "! 🥳 May your laughter echo through the year and your memories stay golden. Celebrate big today! Love, " + sender + " 🍰",
                (recip, sender) => "To " + recip + ", wishing you a sensational birthday celebration filled with love, laughter, and your favorite treats! Always cheering, " + sender + " 🎊",
                (recip, sender) => "Dearest " + recip + ", words cannot fully express how much your friendship means to me. Thank you for your warmth and loyalty. Happy Birthday! Love always, " + sender + " ❤️",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌸 Through every season of life, your presence has been a comfort and a joy. May life give you all the happiness you deserve. From " + sender + " 💖",
                (recip, sender) => "To my dearest " + recip + ", Happy Birthday! 🌟 Having you in my life is a true blessing I cherish every single day. Wishing you endless peace and joy, " + sender + " ✨",
                (recip, sender) => "Dearest " + recip + ", you are family to my heart. On your birthday, I wish you good health, genuine smiles, and love that never fades. Always here for you, " + sender + " ❤️",
                (recip, sender) => "Happy Birthday, " + recip + "! 💫 Thank you for being the person who understands without words and brings joy without effort. Forever grateful, " + sender + " 🌸",
                (recip, sender) => "To the irreplaceable " + recip + ", Happy Birthday! 🌿 May the universe return to you ten times the kindness, care, and love you give to others. Love from " + sender + " ❤️",
                (recip, sender) => "Dearest " + recip + ", looking back at our memories brings so much warmth. Here is to creating many more beautiful stories together! Happy Birthday, " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 💖 You have a heart of pure gold. May your days be blessed with deep peace and loving companions. Always yours, " + sender + " 🌺",
                (recip, sender) => "To dearest " + recip + ", on your special day: Remember that you are cherished, valued, and deeply loved. Happy Birthday from the bottom of my heart, " + sender + " ❤️",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌷 Your friendship is one of the brightest treasures in my life. Wishing you a year full of quiet joys and big triumphs, " + sender + " 🌟",
                (recip, sender) => "Dearest " + recip + ", thank you for being you—authentic, kind, and wonderful. May this birthday bring you pure happiness. Warmest love from " + sender + " 💫",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌸 Life is so much richer with you in it. May all your silent prayers be answered with blessings. Always in your corner, " + sender + " ❤️",
                (recip, sender) => "To my dear friend " + recip + ", Happy Birthday! 🌿 May you always know how deeply valued you are. Wishing you peace, health, and joy, " + sender + " 💖",
                (recip, sender) => "Dearest " + recip + ", on this milestone of your journey, I celebrate your beautiful heart and your shining spirit. Happy Birthday with all my love, " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌺 May the road ahead be gentle, the people around you be loving, and your heart be at peace. From " + sender + " with deep affection ❤️",
                (recip, sender) => "To dearest " + recip + ", wishing you a birthday as tender, genuine, and beautiful as your soul. Forever cheering for your happiness, " + sender + " 💫",
                (recip, sender) => "Happy Birthday, " + recip + "! 💖 Thank you for the laughs, the support, and the memories. May your coming year be your brightest yet! Love, " + sender + " 🌸",
                (recip, sender) => "Happy Birthday, champion " + recip + "! 🏆 May this year shatter every limitation and elevate you to your greatest achievements yet. Go crush it! From " + sender + " 🚀",
                (recip, sender) => "To " + recip + ", on your birthday: Keep building, keep conquering, and keep inspiring everyone around you. Victory looks good on you! Best wishes, " + sender + " ⚡",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎯 May every goal you set this year turn into a triumphant reality. The summit is waiting for you! Your supporter, " + sender + " 🏔️",
                (recip, sender) => "To the hardworking " + recip + ", Happy Birthday! 💡 May your relentless effort pay off with grand rewards, prestige, and deep satisfaction. From " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 🚀 Stay bold, stay hungry, and keep leveling up. This year is yours to dominate! Cheering loud, " + sender + " 💥",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🏆 May your career soar, your ventures thrive, and your confidence remain unshakeable. Best regards from " + sender + " 📈",
                (recip, sender) => "Happy Birthday, " + recip + "! ⚡ You were made to achieve extraordinary things. Keep that fire burning and conquer every challenge! From " + sender + " 🎯",
                (recip, sender) => "To the dynamic " + recip + ", Happy Birthday! 🌟 May this new age bring you high-impact opportunities and massive wins. Always in your corner, " + sender + " 🚀",
                (recip, sender) => "Happy Birthday, " + recip + "! 💎 Pressure turns carbon into diamonds, and you shine brighter every year. Keep leading the way! High five from " + sender + " 🏆",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🎯 May your strategies work flawlessly and your vision guide you straight to the top. Proud of you, " + sender + " 💡",
                (recip, sender) => "Happy Birthday, " + recip + "! 🚀 May this year be your most breakthrough-filled, productive, and victorious year yet! From " + sender + " with full support ⚡",
                (recip, sender) => "To the powerhouse " + recip + ", Happy Birthday! 🌟 Keep breaking barriers and rewriting what is possible. The future is yours! Your friend, " + sender + " 🏆",
                (recip, sender) => "Happy Birthday, " + recip + "! 🏔️ Rise above every obstacle and claim the success you have worked so hard for. Best wishes always, " + sender + " 🎯",
                (recip, sender) => "To " + recip + ", on your birthday: May your drive stay fierce and your accomplishments speak volumes. Keep winning! Cheers from " + sender + " 🚀",
                (recip, sender) => "Happy Birthday, " + recip + "! 💡 May you turn every dream into an empire and every effort into gold. Always cheering for you, " + sender + " ⚡",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🏆 Another year of proving that nothing is impossible with dedication and passion. High regards, " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, " + recip + "! 🎯 May your ambition meet divine timing and lead to your greatest triumphs yet. From your supporter, " + sender + " 🚀",
                (recip, sender) => "Happy Birthday, sweet " + recip + "! 🌸 May your day be as gentle, sunny, and delightful as your smile. Wishing you endless happiness, " + sender + " 🌷",
                (recip, sender) => "To the lovely " + recip + ", Happy Birthday! 🍰 May your heart be light, your smile be bright, and your day be filled with warm hugs. Love from " + sender + " 🎈",
                (recip, sender) => "Happy Birthday, dearest " + recip + "! 🌟 Sending you bouquets of happiness, boxes of laughter, and a year full of sweet memories. From " + sender + " 💐",
                (recip, sender) => "To " + recip + ", wishing you the sweetest birthday! 🍭 May simple joys and heartwarming moments fill every corner of your special day. Love, " + sender + " ✨",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌿 May your day be peaceful, cozy, and wrapped in the love of those who cherish you most. Warmly, " + sender + " ☕",
                (recip, sender) => "To the radiant " + recip + ", Happy Birthday! 🌺 Keep lighting up the world with your gentle warmth and sincere smile. Hugs from " + sender + " 💖",
                (recip, sender) => "Happy Birthday, sweet soul " + recip + "! 🧁 May your birthday cake be delicious, your celebrations be cozy, and your year be sweet. Love from " + sender + " 🍓",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌈 May life sprinkle gentle magic and sweet blessings over everything you do. Always wishing you the best, " + sender + " 🌸",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌼 May your heart always feel light and your days always feel bright. Lovingly wishing you a magical year, " + sender + " ✨",
                (recip, sender) => "To the sweet " + recip + ", Happy Birthday! 🕊️ May you be blessed with quiet moments of joy, loving friendships, and warm coffee. Hugs, " + sender + " ☕",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌸 May today bring you all the gentle warmth and sweetest smiles that life has to offer. Love always, " + sender + " 💖",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌷 May your spirit remain tender, your laughter remain bright, and your heart remain at peace. From " + sender + " 🌟",
                (recip, sender) => "Happy Birthday, sweet " + recip + "! 🍓 Wishing you a day full of sweet surprises, lovely conversations, and heartwarming love. From " + sender + " 🍰",
                (recip, sender) => "To " + recip + ", Happy Birthday! 🌺 May your year be soft, bright, and filled with the sweetest blessings of life. Lovingly from " + sender + " 🌸",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌿 Sending you a warm cup of love, a plate full of joy, and a sky full of blessings. Warm hugs from " + sender + " ✨",
                (recip, sender) => "To the sweetest " + recip + ", Happy Birthday! 💖 May today remind you how truly special and cherished you are by everyone around you. Love, " + sender + " 🌷",
                (recip, sender) => "Happy Birthday, " + recip + "! 🌈 May your path be sprinkled with kindness, joy, and the sweetest memories you will cherish forever. From " + sender + " 🌸"
            ],
            wishBadges: ['✨ Limitless Joy', '❤️ Pure Love', '🎯 Grand Success', '🌟 Beautiful Memories'],
            tab1Badge: '❤️ A Message From The Heart',
            tab1Heading: (recip) => `Special Letter for ${recip}`,
            tab1Letters: [
                (recip, sender) => `Dearest ${recip},\n\nEvery now and then, life blesses us with someone whose presence feels like pure sunshine on a cloudy day. That person is you. Thank you for the countless laughs we share, the quiet comfort of knowing someone so genuine, and the warmth you bring into every conversation.\n\nAs you celebrate another milestone of life, I wish you unbounded courage to chase your biggest dreams, unwavering confidence in your talents, and an abundance of inner peace. You are truly one of a kind, and having you in my life is a gift I will always cherish.\n\nAlways here for you,\n${sender} ❤️`,
                (recip, sender) => `My Dearest ${recip},\n\nYou possess a rare, beautiful grace of making everyone around you feel valued, heard, and deeply happy. On this special birthday, I pray that the universe returns all the kindness, love, and care you give to others multiplied tenfold.\n\nMay you achieve every ambition you set your mind to, and may you find immense joy in the simplest pleasures of everyday life. Thank you for being your wonderful, authentic self.\n\nWith deep affection and respect,\n${sender} ✨`,
                (recip, sender) => `Dearest ${recip},\n\nTime moves fast, but the memories, laughter, and unbreakable bond we share remain forever close to my heart. Watching you grow, overcome challenges, and achieve great milestones brings so much pride and happiness.\n\nMay this year unfold with serendipity, great health, prosperous endeavors, and cherished moments with those you love. Keep dreaming big, because you are capable of achieving greatness.\n\nAlways in your corner,\n${sender} 🌸`
            ],
            tab2Badge: '📸 Treasured Memories',
            tab2Title: 'Moments We Cherish',
            tab2Subtitle: 'Tap any Polaroid to look closer ✨',
            tab2Cards: [
                { caption: 'Unforgettable Days', note: 'Laughs, coffee & endless chats ✨' },
                { caption: 'B-Day Vibes!', note: 'Golden sunset & happy sparklers 🌊' },
                { caption: 'Campfire Melodies', note: 'Under the twinkling night stars 🌟' }
            ],
            tab3Badge: '🎂 Make A Wish',
            tab3Title: 'Blow Out The Candles!',
            tab3Hint: '💨 Tap the candles or cake to blow them out & make a wish!',
            tab3Wishes: [
                '✨ Your wish is sent to the stars! May every single dream of yours come true! ✨',
                '🌟 The universe heard your deepest wish! May abundant joy and victory be yours! 🌟',
                '💫 May every silent prayer of yours be answered with peace and happiness! 💫',
                '✨ Candles extinguished, dreams unleashed! Have the most magical year ahead! ✨'
            ],
            surpriseBadge: '🎁 Special Surprise',
            surpriseTitle: 'I Have A Surprise For You! ✨',
            surpriseTeaser: '"Wait for a while... Take a deep breath & close your eyes 🤫 Something truly extraordinary is prepared just for you!"',
            oracleHeading: '💫 What do you want the most in this upcoming year?',
            oracleOpt1Title: 'Grand Success & Big Wins',
            oracleOpt1Sub: 'Crush every goal & rise high',
            oracleOpt2Title: 'Deep Love & Peace of Mind',
            oracleOpt2Sub: 'Endless warmth, joy & good health',
            oracleOpt3Title: 'Unforgettable Adventures',
            oracleOpt3Sub: 'Golden travels & smiling moments',
            oracleOpt4Title: 'All My Secret Dreams',
            oracleOpt4Sub: 'Pure magic & miracles from universe',
            oracleFortuneTitle: '✨ Your Surprise Destiny Blessing ✨',
            oracleReveals: {
                success: (recip, sender) => `"Dearest ${recip}, your hard work, talent, and passion are going to unlock unbelievable opportunities. May every goal you set turn into your grandest victory!"\n\n— Cheering for your triumphs, ${sender} 🚀✨`,
                love: (recip, sender) => `"Dearest ${recip}, you deserve boundless love, deep inner tranquility, unbreakable friendships, and radiant health. May you always feel cherished and happy."\n\n— With all my love, ${sender} 💖🌸`,
                adventure: (recip, sender) => `"Dearest ${recip}, get ready for thrilling travels, unforgettable sunrises, joyful reunions, and memories you will treasure forever!"\n\n— Your partner in crime, ${sender} ✈️🎉`,
                miracle: (recip, sender) => `"Dearest ${recip}, the universe has heard your silent prayers. Expect miraculous breakthroughs, glowing serendipity, and dreams turning into reality!"\n\n— Believing in you always, ${sender} 🌟💫`
            },
            tab4Badge: '💌 Secret Surprise',
            tab4Title: 'A Hidden Letter For You',
            tab4Desc: 'Tap the golden wax seal to unseal the letter.',
            tab4SecretLetters: [
                (recip, sender) => `"Never doubt how uniquely talented, loved, and deeply appreciated you are, ${recip}. You have a rare heart of gold that makes a positive difference wherever you go. Keep conquering the world with your beautiful smile!"\n\n— Forever yours, ${sender} ❤️`,
                (recip, sender) => `"You have an inner light that brightens even the toughest days, ${recip}. Stay authentic, stay bold, and keep shining brightly because the universe has extraordinary things in store for you!"\n\n— Always rooting for you, ${sender} ✨`,
                (recip, sender) => `"In every chapter of life, always remember you are treasured beyond words, ${recip}. May happiness, peace, and good fortune follow you wherever you go!"\n\n— With deepest affection, ${sender} 🌸`
            ],
            tab5Badge: '🌟 Wishing You The Best Year Ever',
            tab5Title: 'Happy Birthday!',
            tab5Wishes: [
                { icon: '💫', title: 'Endless Joy & Radiant Health', desc: 'May vitality, peace of mind, and smiling days be your constant companions.' },
                { icon: '🚀', title: 'Limitless Success & Milestones', desc: 'May every goal you set transform into your greatest victory.' },
                { icon: '💖', title: 'Unconditional Love & Warmth', desc: 'Surrounded by genuine smiles, true warmth, and lifelong happiness.' }
            ],
            btnStart: '✨ Read Personal Letter 💌',
            btnCake: '🎂 Cake & Surprises ➔',
            btnNextMemories: 'Relive Our Memories 📸',
            btnNextCake: 'Time For The Cake! 🎂',
            btnNextEnvelope: 'One More Secret Surprise 💌',
            btnNextFinale: 'Final Celebration 🌟',
            btnReplay: '🔄 Replay Journey'
        },

        hi: {
            toLabel: '🎁 प्रिय:',
            fromLabel: 'सस्नेह एवं शुभकामनाओं सहित',
            mainHeading: (recip) => `जन्मदिन मुबारक हो, ${recip}!`,
            mainTagline: 'ईश्वर से प्रार्थना है कि आपका यह दिन खुशियों और मिठास से भर जाए! 🎉',
            mainWishes: [
                (recip, sender) => `प्रिय ${recip}, जन्मदिन के इस पावन अवसर पर आपको ढेर सारा प्यार और अनगिनत शुभकामनाएं! 🎂 ईश्वर करे आपका हर दिन नई उम्मीदों, सुंदर मुस्कान और अपार सफलता से महके। आप जैसे नेक दिल और सच्चे इंसान का होना हम सबके जीवन में एक अनमोल वरदान है।\n\nदुआ है कि आपके जीवन का हर लम्हा खुशियों की सौगात लेकर आए, हर मुश्किल आसान हो और आपके सारे सपने साकार हों। दिल से आपका, ${sender} ❤️`,
                (recip, sender) => `जन्मदिन की बहुत-बहुत बधाई, प्यारी सी ${recip}! 🎉 आपके जीवन का यह नया साल आपके लिए सुख, शांति, उत्तम स्वास्थ्य और ढेरों खुशियां लेकर आए। आपकी सकारात्मक सोच और प्यारी मुस्कान हमेशा यूं ही खिली रहे।\n\nजीवन के हर मोड़ पर आपको कामयाबी मिले और आप नई ऊंचाइयों को छूते रहें। हमेशा आपके साथ, ${sender} ✨`,
                (recip, sender) => `प्रिय ${recip}, ईश्वर से यही मंगल प्रार्थना है कि आपकी हर अधूरी ख्वाहिश पूरी हो और आपके जीवन में खुशियों की कभी कोई कमी न हो। आप हमेशा यूं ही तरक्की और सच्चाई की राह पर आगे बढ़ते रहें।\n\nआपकी ज़िंदगी में हमेशा खुशियों के फूल खिलते रहें। ढेर सारा प्यार, ${sender} 💫`,
                (recip, sender) => `अनमोल मित्र ${recip}, जन्मदिन के इस खूबसूरत दिन पर ईश्वर आपको वो सारी खुशियां दे जिसके आप हकदार हैं। आपका हर दिन खुशियों का उत्सव बने और हर दिन एक नई उमंग लेकर आए!\n\nसदा आपका शुभचिंतक, ${sender} 💖`
            ],
            wishBadges: ['✨ असीम खुशियां', '❤️ सच्चा प्यार', '🎯 भव्य सफलता', '🌟 अनमोल यादें'],
            tab1Badge: '❤️ दिल से लिखा पैगाम',
            tab1Heading: (recip) => `${recip} के लिए एक खास पत्र`,
            tab1Letters: [
                (recip, sender) => `प्रिय ${recip},\n\nज़िंदगी में कुछ रिश्ते और लोग इतने खास होते हैं कि उनकी मौजूदगी ही हर पल को खूबसूरत बना देती है। आप वही खास इंसान हैं। आपकी सकारात्मक सोच, समझदारी और प्यारी मुस्कान हर किसी का दिल जीत लेती है।\n\nइस जन्मदिन पर मैं दिल से प्रार्थना करता हूँ कि आपको दुनिया की सारी खुशियां, सुकून और उत्तम स्वास्थ्य मिले। जीवन की हर जंग में आपको जीत हासिल हो और आप हमेशा मुस्कुराते रहें।\n\nहमेशा आपका साथ निभाने वाला,\n— आपका ${sender} ❤️`,
                (recip, sender) => `प्रिय ${recip},\n\nआपके साथ बिताया हुआ हर लम्हा, हर हंसी और हर बात हमेशा यादगार रहती है। आप जीवन के हर मोड़ पर ऐसे ही चमकते रहें और अपने सभी सपनों को अपनी मेहनत से साकार करें।\n\nईश्वर आपको दीर्घायु और अपार सुख-समृद्धि प्रदान करे। जन्मदिन की ढेरों शुभकामनाएं!\n— ${sender} ✨`
            ],
            tab2Badge: '📸 हमारी अनमोल यादें',
            tab2Title: 'वे प्यारे पल',
            tab2Subtitle: 'तस्वीरें जो हमेशा हमारे दिल के करीब रहती हैं ✨',
            tab2Cards: [
                { caption: 'हसीन मुलाकातें', note: 'चाय की चुस्कियां और बेपरवाह हंसी ✨' },
                { caption: 'मस्ती भरा दिन!', note: 'सुनहरी शाम और जगमगाते फुलझड़ियां 🌊' },
                { caption: 'तारों की छांव', note: 'सुरीले तराने और यादगार रात 🌟' }
            ],
            tab3Badge: '🎂 मोमबत्ती बुझाएं',
            tab3Title: 'मोमबत्ती बुझाएं और विश मांगें!',
            tab3Hint: '💨 केक या मोमबत्तियों पर टैप करें और दिल से एक प्यारी विश मांगें!',
            tab3Wishes: [
                '✨ आपकी हर दुआ कुबूल हो और सारे सपने सच हों! ✨',
                '🌟 ईश्वर आपकी झोली खुशियों और कामयाबी से भर दे! 🌟',
                '💫 मांगी हुई हर मन्नत पूरी हो और जीवन महक उठे! 💫'
            ],
            surpriseBadge: '🎁 खास सरप्राइज',
            surpriseTitle: 'आपके लिए एक खास सरप्राइज! ✨',
            surpriseTeaser: '"थोड़ा इंतज़ार करें... एक गहरी सांस लें और आंखें बंद करें 🤫 आपके लिए कुछ बेहद खास तैयार किया गया है!"',
            oracleHeading: '💫 इस नए साल में आप सबसे ज्यादा क्या चाहते हैं?',
            oracleOpt1Title: 'अपार सफलता एवं तरक्की',
            oracleOpt1Sub: 'हर मुकाम पर जीत और मान-सम्मान',
            oracleOpt2Title: 'सच्चा प्यार एवं मन की शांति',
            oracleOpt2Sub: 'अपनों का साथ और उत्तम स्वास्थ्य',
            oracleOpt3Title: 'यादगार सफर और खुशियां',
            oracleOpt3Sub: 'हसीन यात्राएं और सुनहरी यादें',
            oracleOpt4Title: 'सारे अधूरे सपनों की पूर्ति',
            oracleOpt4Sub: 'ईश्वर का आशीर्वाद और चमत्कार',
            oracleFortuneTitle: '✨ आपके भाग्य का विशेष वरदान ✨',
            oracleReveals: {
                success: (recip, sender) => `"प्रिय ${recip}, आपकी मेहनत और प्रतिभा इस साल आपको कामयाबी की नई ऊंचाइयों पर ले जाएगी। आपका हर सपना पूरा हो!"\n\n— आपकी जीत का साथी, ${sender} 🚀✨`,
                love: (recip, sender) => `"प्रिय ${recip}, आप दुनिया के सबसे खूबसूरत प्यार, अपनों के स्नेह और भरपूर स्वास्थ्य के हकदार हैं। सदा मुस्कुराते रहें!"\n\n— ढेर सारे प्यार से, ${sender} 💖🌸`,
                adventure: (recip, sender) => `"प्रिय ${recip}, यह साल आपके लिए रोमांचक सफर, हसीन वादियों और कभी न भूलने वाली प्यारी यादों से भरा रहे!"\n\n— आपका सच्चा दोस्त, ${sender} ✈️🎉`,
                miracle: (recip, sender) => `"प्रिय ${recip}, आपकी मांगी हर दुआ सच होने जा रही है। जीवन में चमत्कारिक खुशियों का स्वागत करें!"\n\n— हमेशा आपके साथ, ${sender} 🌟💫`
            },
            tab4Badge: '💌 छुपा हुआ तोहफा',
            tab4Title: 'आपके लिए एक गुप्त पत्र',
            tab4Desc: 'मोहर तोड़कर पत्र खोलने के लिए सील पर टैप करें।',
            tab4SecretLetters: [
                (recip, sender) => `"कभी मत भूलना कि आप कितने अद्भुत, प्रतिभावान और प्यारे इंसान हैं, ${recip}। आप सचमुच अनमोल हैं। हमेशा मुस्कुराते रहो!"\n\n— सस्नेह, ${sender} ❤️`,
                (recip, sender) => `"आपकी मुस्कान में वो जादू है जो हर गम को भुला देती है, ${recip}। सदा ऐसे ही खुशमिज़ाज रहो और आगे बढ़ो!"\n\n— दिल से, ${sender} ✨`
            ],
            tab5Badge: '🌟 अंतिम मंगल कामनाएं',
            tab5Title: 'जन्मदिन की हार्दिक बधाई!',
            tab5Wishes: [
                { icon: '💫', title: 'उत्तम स्वास्थ्य एवं मन की शांति', desc: 'सदा निरोगी रहें और हर दिन एक नई उमंग के साथ मुस्कुराएं।' },
                { icon: '🚀', title: 'असीम सफलता और तरक्की', desc: 'आपके हर काम में आपको विजय और मान-सम्मान मिले।' },
                { icon: '💖', title: 'सच्चा प्यार और अपनापन', desc: 'सदा अपनों के प्यार और स्नेह की छांव में रहें।' }
            ],
            btnStart: '✨ खास पत्र पढ़ें 💌',
            btnCake: '🎂 केक काटें ➔',
            btnNextMemories: 'यादें ताजा करें 📸',
            btnNextCake: 'केक काटने का समय! 🎂',
            btnNextEnvelope: 'एक और छुपा हुआ तोहफा 💌',
            btnNextFinale: 'अंतिम मंगल कामनाएं 🌟',
            btnReplay: '🔄 फिर से देखें'
        },

        mr: {
            toLabel: '🎁 प्रिय:',
            fromLabel: 'मनापासून प्रेम आणि सदिच्छांसह',
            mainHeading: (recip) => `वाढदिवसाच्या हार्दिक शुभेच्छा, ${recip}!`,
            mainTagline: 'तुमचा हा खास दिवस आनंद आणि गोड आठवणींनी भरून जावो! 🎉',
            mainWishes: [
                (recip, sender) => `प्रिय ${recip}, वाढदिवसाच्या खूप खूप मनःपूर्वक शुभेच्छा! 🎂 ईश्वर चरणी हीच प्रार्थना की तुमचे आयुष्य सुख, समृद्धी, उत्तम आरोग्य आणि भरभरून यशाने उजळून निघो. तुमच्या चेहऱ्यावरील हे सुंदर हास्य असेच कायम राहो.\n\nतुमच्या सर्व इच्छा, आकांक्षा आणि स्वप्ने पूर्ण होवोत. आयुष्यातील प्रत्येक क्षण आनंदाचा आणि समाधानाचा जावो! मनापासून तुमचा, ${sender} ❤️`,
                (recip, sender) => `वाढदिवसाच्या लाख लाख शुभेच्छा, ${recip}! 🎉 आयुष्याच्या प्रत्येक वळणावर तुम्हाला यश आणि आनंद लाभो. येणारे प्रत्येक वर्ष तुमच्यासाठी नवीन स्वप्न आणि भरघोस यश घेऊन येवो.\n\nतुमचे प्रेमळ व्यक्तिमत्त्व सर्वांनाच प्रेरणा देते. नेहमी सोबत, ${sender} ✨`,
                (recip, sender) => `गुणी आणि लाडक्या ${recip}, वाढदिवसाच्या हार्दिक शुभेच्छा! 🌸 तुमचे जीवन सुगंधी फुलांसारखे दरवळत राहो आणि यशाची उंच शिखरे तुम्ही सहज पादाक्रांत करो.\n\nखूप खूप प्रेम आणि सदिच्छा, ${sender} 💖`
            ],
            wishBadges: ['✨ अथांग आनंद', '❤️ निर्मळ प्रेम', '🎯 उत्तुंग यश', '🌟 सोनेरी आठवणी'],
            tab1Badge: '❤️ मनातील एक गोड संदेश',
            tab1Heading: (recip) => `${recip} साठी एक खास पत्र`,
            tab1Letters: [
                (recip, sender) => `प्रिय ${recip},\n\nकाही माणसं आयुष्यात येतात आणि त्यांच्या अस्तित्वाने संपूर्ण आयुष्य सुंदर होऊन जातं. तुम्ही त्यापैकीच एक आहात. तुमचे प्रेमळ बोलणे आणि निखळ स्वभाव सर्वांनाच भुरळ पाडतो.\n\nया वाढदिवशी तुम्हाला जगातील सर्व सुख, यश, निरोगी आयुष्य आणि समाधान मिळो हीच ईश्वरचरणी प्रार्थना. नेहमी हसत राहा आणि प्रगती करत राहा!\n\n— तुमचा/तुमची, ${sender} ❤️`,
                (recip, sender) => `प्रिय ${recip},\n\nतुमच्यासोबत घालवलेला प्रत्येक क्षण आणि केलेल्या गप्पा कायम स्मरणात राहतील अशा आहेत. तुम्ही असेच जीवनात पुढे जात राहा आणि प्रत्येक ध्येय गाठा.\n\nवाढदिवसाच्या मनःपूर्वक शुभेच्छा!\n— ${sender} ✨`,
                (recip, sender) => `प्रिय ${recip},\n\nआयुष्यात कितीही संकटे आली तरी तुमच्यातील सकारात्मकता आणि जिद्द कायम राहो. तुमच्या सर्व मनोकामना पूर्ण होवोत.\n\nसदैव सदिच्छांसह,\n— ${sender} 🌸`,
                (recip, sender) => `प्रिय ${recip},\n\nतुमचा हा खास दिवस तुमच्या आयुष्याला एक नवी दिशा आणि नवी ऊर्जा देवो. नेहमी आनंदी राहा!\n— ${sender} 💫`
            ],
            tab2Badge: '📸 आपल्या गोड आठवणी',
            tab2Title: 'गोड आठवणी',
            tab2Subtitle: 'क्षण जे कायम आपल्या मनात जिवंत राहतील ✨',
            tab2Cards: [
                { caption: 'आनंदाचे क्षण', note: 'चहाच्या सोबतीला रंगलेल्या मनसोक्त गप्पा ✨' },
                { caption: 'मजेशीर दिवस!', note: 'सुंदर संध्याकाळ आणि आनंदाचे क्षण 🌊' },
                { caption: 'चांदण्यांची रात्र', note: 'शांत निसर्ग आणि सुरेल आठवणी 🌟' }
            ],
            tab3Badge: '🎂 मेणबत्त्या विझवा',
            tab3Title: 'मेणबत्त्या विझवा आणि इच्छा मागा!',
            tab3Hint: '💨 केक किंवा मेणबत्त्यांवर टॅप करा आणि एक गोड इच्छा व्यक्त करा!',
            tab3Wishes: [
                '✨ तुमची प्रत्येक इच्छा आणि स्वप्न पूर्ण होवो! ✨',
                '🌟 परमेश्वर तुमच्या सर्व मनोकामना पूर्ण करो! 🌟',
                '💫 मेणबत्त्या विझल्या, स्वप्ने उजळली! शुभ वाढदिवस! 💫'
            ],
            surpriseBadge: '🎁 खास सरप्राईज',
            surpriseTitle: 'तुमच्यासाठी एक गोड सरप्राईज! ✨',
            surpriseTeaser: '"थोडा वेळ थांबा... दीर्घ श्वास घ्या आणि डोळे मिटा 🤫 तुमच्यासाठी एक अत्यंत खास गोष्ट तयार केली आहे!"',
            oracleHeading: '💫 या नवीन वर्षात तुम्हाला सर्वात जास्त काय हवे आहे?',
            oracleOpt1Title: 'उत्तुंग यश व प्रगती',
            oracleOpt1Sub: 'प्रत्येक ध्येय गाठा आणि पुढे जा',
            oracleOpt2Title: 'अखंड प्रेम व मनःशांती',
            oracleOpt2Sub: 'निरोगी आयुष्य आणि प्रेमळ माणसे',
            oracleOpt3Title: 'सुंदर प्रवास व गोड आठवणी',
            oracleOpt3Sub: 'आनंदाचे क्षण आणि हसरे दिवस',
            oracleOpt4Title: 'सर्व स्वप्नांची पूर्तता',
            oracleOpt4Sub: 'देवाचा कृपाशीर्वाद आणि यश',
            oracleFortuneTitle: '✨ तुमच्या नशिबाचा खास आशीर्वाद ✨',
            oracleReveals: {
                success: (recip, sender) => `"प्रिय ${recip}, तुमची मेहनत आणि जिद्द तुम्हाला यशाच्या शिखरावर घेऊन जाईल. तुमची सर्व स्वप्ने सत्यात उतरोत!"\n\n— मनापासून शुभेच्छा, ${sender} 🚀✨`,
                love: (recip, sender) => `"प्रिय ${recip}, तुम्हाला आयुष्यभर निखळ प्रेम, उत्तम आरोग्य आणि भरभरून समाधान मिळो हीच ईश्वरचरणी प्रार्थना!"\n\n— खूप खूप प्रेमासह, ${sender} 💖🌸`,
                adventure: (recip, sender) => `"प्रिय ${recip}, हे वर्ष तुमच्यासाठी नवनवीन भ्रमंती, धमाल मस्ती आणि अविस्मरणीय क्षणांनी भरलेले जावो!"\n\n— आपला स्नेही, ${sender} ✈️🎉`,
                miracle: (recip, sender) => `"प्रिय ${recip}, तुमच्या मनातल्या सर्व इच्छा पूर्ण होवोत आणि आयुष्यात आनंदाची बरसात होवो!"\n\n— सदैव सोबत, ${sender} 🌟💫`
            },
            tab4Badge: '💌 गुप्त सरप्राईज',
            tab4Title: 'खास तुमच्यासाठी एक पत्र',
            tab4Desc: 'पत्र उघडण्यासाठी मेणाच्या मोहरेवर टॅप करा.',
            tab4SecretLetters: [
                (recip, sender) => `"कधीही विसरू नका की तुम्ही किती हुशार, प्रेमळ आणि मौल्यवान आहात, ${recip}. तुम्ही खरंच अनमोल आहात. सतत चमकत राहा!"\n\n— मनापासून, ${sender} ❤️`,
                (recip, sender) => `"तुमच्या निखळ हास्याने अनेकांच्या चेहऱ्यावर आनंद येतो, ${recip}. सदा ऐसेच हसतमुख राहा!"\n\n— आपला स्नेही, ${sender} ✨`,
                (recip, sender) => `"आयुष्याच्या प्रत्येक टप्प्यावर यश तुमच्या पाठीशी राहो, ${recip}. वाढदिवसाच्या हार्दिक सदिच्छा!"\n\n— ${sender} 🌸`
            ],
            tab5Badge: '🌟 वाढदिवसाच्या मंगलमय शुभेच्छा!',
            tab5Title: 'वाढदिवसाच्या हार्दिक शुभेच्छा!',
            tab5Wishes: [
                { icon: '💫', title: 'उत्तम आरोग्य व दीर्घायुष्य', desc: 'निरोगी जीवन आणि चेहऱ्यावर सदा प्रसन्न हास्य लाभो.' },
                { icon: '🚀', title: 'उत्तुंग यश व प्रगती', desc: 'हाती घेतलेल्या प्रत्येक कार्यात यश मिळो.' },
                { icon: '💖', title: 'अखंड प्रेम व जिव्हाळा', desc: 'नेहमी कुटुंब आणि आप्तेष्टांच्या प्रेमात राहा.' }
            ],
            btnStart: '✨ खास पत्र वाचा 💌',
            btnCake: '🎂 केक कापा ➔',
            btnNextMemories: 'आठवणी पुन्हा जगा 📸',
            btnNextCake: 'केक कापण्याची वेळ! 🎂',
            btnNextEnvelope: 'आणखी एक गुप्त सरप्राईज 💌',
            btnNextFinale: 'अंतिम सदिच्छा 🌟',
            btnReplay: '🔄 पुन्हा पहा'
        }
    };

    function getDeterministicIndex(seed, max) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % max;
    }

    // Dynamic Stages: Exclude Stage 2 (Memories) if no custom photos added!
    function getActiveStageIds() {
        if (customPhotos && customPhotos.length > 0) {
            return ['stage-0', 'stage-1', 'stage-2', 'stage-3', 'stage-surprise', 'stage-4', 'stage-5'];
        }
        return ['stage-0', 'stage-1', 'stage-3', 'stage-surprise', 'stage-4', 'stage-5'];
    }

    // =========================================================================
    // RENDER / UPDATE ALL CARDS IN ACTIVE LANGUAGE
    // =========================================================================

    function renderAllContent() {
        const langData = contentDictionary[currentLanguage] || contentDictionary.en;
        const mainWishIndex = getDeterministicIndex(recipientName + '_main', langData.mainWishes.length);
        const letterIndex = getDeterministicIndex(recipientName + '_letter', langData.tab1Letters.length);
        const cakeIndex = getDeterministicIndex(recipientName + '_cake', langData.tab3Wishes.length);
        const secretIndex = getDeterministicIndex(recipientName + '_secret', langData.tab4SecretLetters.length);

        const activeMainWish = langData.mainWishes[mainWishIndex](recipientName, senderName);
        const activeLetter = langData.tab1Letters[letterIndex](recipientName, senderName);
        const formattedMainWish = activeMainWish.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
        const formattedLetter = activeLetter.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

        // Update Screen 0 (Main Direct Landing Card)
        const elToBadge = document.querySelector('.card-to-badge');
        if (elToBadge) {
            elToBadge.innerHTML = `<span>${langData.toLabel}</span> <span class="recipient-highlight">${recipientName}</span> <span>✨</span>`;
        }
        const elStage0Head = document.getElementById('stage0-main-heading');
        if (elStage0Head) elStage0Head.textContent = langData.mainHeading(recipientName);

        const elStage0Tagline = document.getElementById('stage0-tagline');
        if (elStage0Tagline) elStage0Tagline.textContent = langData.mainTagline;

        const elStage0Wish = document.getElementById('stage0-wish-content');
        if (elStage0Wish) elStage0Wish.innerHTML = formattedMainWish;

        const elStage0Pills = document.getElementById('stage0-wishes-pills');
        if (elStage0Pills && langData.wishBadges) {
            elStage0Pills.innerHTML = langData.wishBadges.map(b => `<span class="bday-wish-tag">${b}</span>`).join('');
        }

        const elFromBox = document.querySelector('.card-from-box');
        if (elFromBox) {
            elFromBox.innerHTML = `<div class="card-from-label">${langData.fromLabel}</div><div class="sender-highlight">${senderName} ❤️</div>`;
        }

        // Update Screen 1 (Personal Soul Letter)
        const elStage1Badge = document.getElementById('stage1-badge');
        if (elStage1Badge) elStage1Badge.textContent = langData.tab1Badge;

        const elMsgHeading = document.getElementById('msg-card-heading');
        if (elMsgHeading) elMsgHeading.textContent = langData.tab1Heading(recipientName);

        const elTypewriter = document.getElementById('typewriter-content');
        if (elTypewriter) elTypewriter.innerHTML = formattedLetter;

        const elStage1Pills = document.getElementById('stage1-wishes-pills');
        if (elStage1Pills && langData.wishBadges) {
            elStage1Pills.innerHTML = langData.wishBadges.slice(0, 3).map(b => `<span class="bday-wish-tag">${b}</span>`).join('');
        }

        const elMsgSenderBox = document.getElementById('msg-sender-signature');
        if (elMsgSenderBox) {
            elMsgSenderBox.innerHTML = `${langData.fromLabel}:<br><span id="msg-sender-name">${senderName}</span> ❤️`;
        }

        // Update Screen 2 (Memories) - Only if photos exist
        renderMemoriesGallery(langData);

        // Update Screen 3 (Cake)
        const elStage3Badge = document.getElementById('stage3-badge');
        if (elStage3Badge) elStage3Badge.textContent = langData.tab3Badge;
        const elStage3Title = document.getElementById('stage3-title');
        if (elStage3Title) elStage3Title.textContent = langData.tab3Title;
        const elCakeHint = document.getElementById('cake-status-hint');
        if (elCakeHint) elCakeHint.textContent = langData.tab3Hint;
        const elWishBannerText = document.getElementById('cake-wish-text');
        if (elWishBannerText) elWishBannerText.textContent = langData.tab3Wishes[cakeIndex];

        // Update Screen Surprise ("I Have A Surprise For You" & Oracle)
        const elSurpriseBadge = document.getElementById('stage-surprise-badge');
        if (elSurpriseBadge) elSurpriseBadge.textContent = langData.surpriseBadge;
        const elSurpriseTitle = document.getElementById('stage-surprise-title');
        if (elSurpriseTitle) elSurpriseTitle.textContent = langData.surpriseTitle;
        const elSurpriseTeaser = document.getElementById('stage-surprise-teaser');
        if (elSurpriseTeaser) elSurpriseTeaser.textContent = langData.surpriseTeaser;
        const elOracleHeading = document.getElementById('oracle-heading');
        if (elOracleHeading) elOracleHeading.textContent = langData.oracleHeading;

        const elOpt1Title = document.getElementById('oracle-opt-1-title');
        if (elOpt1Title) elOpt1Title.textContent = langData.oracleOpt1Title;
        const elOpt1Sub = document.getElementById('oracle-opt-1-sub');
        if (elOpt1Sub) elOpt1Sub.textContent = langData.oracleOpt1Sub;

        const elOpt2Title = document.getElementById('oracle-opt-2-title');
        if (elOpt2Title) elOpt2Title.textContent = langData.oracleOpt2Title;
        const elOpt2Sub = document.getElementById('oracle-opt-2-sub');
        if (elOpt2Sub) elOpt2Sub.textContent = langData.oracleOpt2Sub;

        const elOpt3Title = document.getElementById('oracle-opt-3-title');
        if (elOpt3Title) elOpt3Title.textContent = langData.oracleOpt3Title;
        const elOpt3Sub = document.getElementById('oracle-opt-3-sub');
        if (elOpt3Sub) elOpt3Sub.textContent = langData.oracleOpt3Sub;

        const elOpt4Title = document.getElementById('oracle-opt-4-title');
        if (elOpt4Title) elOpt4Title.textContent = langData.oracleOpt4Title;
        const elOpt4Sub = document.getElementById('oracle-opt-4-sub');
        if (elOpt4Sub) elOpt4Sub.textContent = langData.oracleOpt4Sub;

        const elFortuneTitle = document.getElementById('revealed-fortune-title');
        if (elFortuneTitle) elFortuneTitle.textContent = langData.oracleFortuneTitle;

        // Update Screen 4 (Secret Envelope)
        const elStage4Badge = document.getElementById('stage4-badge');
        if (elStage4Badge) elStage4Badge.textContent = langData.tab4Badge;
        const elStage4Title = document.getElementById('stage4-title');
        if (elStage4Title) elStage4Title.textContent = langData.tab4Title;
        const elStage4Desc = document.getElementById('stage4-desc');
        if (elStage4Desc) elStage4Desc.textContent = langData.tab4Desc;
        const elEnvelopeText = document.getElementById('envelope-secret-text');
        if (elEnvelopeText) {
            elEnvelopeText.textContent = customMsg || langData.tab4SecretLetters[secretIndex](recipientName, senderName);
        }
        const elEnvelopeSign = document.getElementById('envelope-sender-sign');
        if (elEnvelopeSign) {
            elEnvelopeSign.textContent = `— ${langData.fromLabel}, ${senderName} ❤️`;
        }

        // Update Screen 5 (Finale)
        const elStage5Badge = document.getElementById('stage5-badge');
        if (elStage5Badge) elStage5Badge.textContent = langData.tab5Badge;
        const elStage5Title = document.getElementById('stage5-title');
        if (elStage5Title) elStage5Title.textContent = langData.tab5Title;

        const elStage5WishesBox = document.getElementById('stage5-wishes-box');
        if (elStage5WishesBox && langData.tab5Wishes) {
            elStage5WishesBox.innerHTML = langData.tab5Wishes.map(w => `
                <div class="wish-row">
                    <span class="wish-icon">${w.icon}</span>
                    <div>
                        <div class="wish-title">${w.title}</div>
                        <div class="wish-desc">${w.desc}</div>
                    </div>
                </div>
            `).join('');
        }

        // Update Buttons text dynamically
        const btnStart = document.getElementById('btn-start-journey');
        if (btnStart) btnStart.innerHTML = `<span>${langData.btnStart}</span>`;

        // Update Language Switcher UI Active State
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLanguage);
        });

        renderStepDots();
    }

    // =========================================================================
    // DYNAMIC STEP DOTS & STAGE NAVIGATION
    // =========================================================================

    function renderStepDots() {
        const container = document.getElementById('step-indicators-container');
        if (!container) return;

        if (inGeneratorView) {
            container.style.display = 'none';
            return;
        } else {
            container.style.display = 'flex';
        }

        const activeIds = getActiveStageIds();
        const titles = {
            'stage-0': 'Main Wish',
            'stage-1': 'Letter',
            'stage-2': 'Memories',
            'stage-3': 'Cake',
            'stage-surprise': 'Surprise',
            'stage-4': 'Secret Letter',
            'stage-5': 'Finale'
        };

        container.innerHTML = activeIds.map((id, index) => `
            <div class="step-dot ${index === currentStageIndex ? 'active' : ''} ${index < currentStageIndex ? 'completed' : ''}" data-step-index="${index}" title="${titles[id] || 'Stage'}"></div>
        `).join('');

        container.querySelectorAll('.step-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const targetIdx = parseInt(dot.getAttribute('data-step-index'), 10);
                goToStageIndex(targetIdx);
            });
        });

        // Toggle Stage 2 element visibility
        const stage2El = document.getElementById('stage-2');
        if (stage2El) {
            stage2El.style.display = (customPhotos && customPhotos.length > 0) ? 'flex' : 'none';
        }

        // Update Stage 1 Next button label depending on whether memories exist
        const stage1NextBtn = document.querySelector('#stage-1 .stage-next-btn');
        if (stage1NextBtn) {
            const langData = contentDictionary[currentLanguage] || contentDictionary.en;
            if (customPhotos && customPhotos.length > 0) {
                stage1NextBtn.innerHTML = `<span>${langData.btnNextMemories || 'Relive Our Memories 📸'}</span>`;
            } else {
                stage1NextBtn.innerHTML = `<span>${langData.btnNextCake || 'Time For The Cake! 🎂'}</span>`;
            }
        }
    }

    function showCreateStage() {
        inGeneratorView = true;

        // Deactivate all journey stages
        document.querySelectorAll('.journey-stage').forEach(st => {
            st.classList.remove('active', 'exit-left');
        });

        const stageCreate = document.getElementById('stage-create');
        if (stageCreate) {
            stageCreate.classList.add('active');
            stageCreate.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Populate fields with active values if available
        if (inputBdayName) {
            inputBdayName.value = (isSharedWish || storedWish) ? recipientName : '';
        }
        if (inputSenderName) {
            inputSenderName.value = (isSharedWish || storedWish) ? senderName : '';
        }
        if (inputWishLang) {
            inputWishLang.value = currentLanguage;
        }
        if (inputCustomMsg) {
            inputCustomMsg.value = customMsg || '';
        }

        updatePhotoPreviewsStrip();
        updateShareLinkField();
        renderStepDots();

        const btnRestart = document.getElementById('btn-restart-journey');
        if (btnRestart) btnRestart.style.display = 'none';

        const btnGenerateWishNav = document.getElementById('btn-generate-wish');
        if (btnGenerateWishNav) {
            btnGenerateWishNav.classList.add('active');
        }
    }

    function goToStageIndex(index) {
        inGeneratorView = false;

        const stageCreate = document.getElementById('stage-create');
        if (stageCreate) {
            stageCreate.classList.remove('active', 'exit-left');
        }

        const activeIds = getActiveStageIds();
        if (index < 0 || index >= activeIds.length) return;

        activeIds.forEach((id, idx) => {
            const stageEl = document.getElementById(id);
            if (!stageEl) return;
            if (idx === currentStageIndex && idx !== index) {
                stageEl.classList.remove('active');
                stageEl.classList.add('exit-left');
            } else if (idx === index) {
                stageEl.classList.remove('exit-left');
                stageEl.classList.add('active');
            } else {
                stageEl.classList.remove('active', 'exit-left');
            }
        });

        currentStageIndex = index;
        renderStepDots();

        const btnRestart = document.getElementById('btn-restart-journey');
        if (btnRestart) {
            btnRestart.style.display = currentStageIndex > 0 ? 'inline-flex' : 'none';
        }

        const btnGenerateWishNav = document.getElementById('btn-generate-wish');
        if (btnGenerateWishNav) {
            btnGenerateWishNav.classList.remove('active');
        }

        const activeId = activeIds[index];
        handleStageEntryById(activeId);
    }

    function handleStageEntryById(stageId) {
        switch (stageId) {
            case 'stage-1':
                if (window.confettiFX) {
                    window.confettiFX.cannon(true);
                    setTimeout(() => window.confettiFX.cannon(false), 300);
                    setTimeout(() => window.confettiFX.burst(window.innerWidth / 2, window.innerHeight * 0.4, 70), 600);
                }
                if (window.fireworksFX) {
                    window.fireworksFX.launch();
                    setTimeout(() => window.fireworksFX.launch(), 400);
                }
                break;
            case 'stage-2':
            case 'stage-3':
                if (window.soundEngine) window.soundEngine.playSparkle();
                break;
            case 'stage-5':
                if (window.fireworksFX) window.fireworksFX.startAutoLaunch(1400);
                if (window.confettiFX) {
                    window.confettiFX.burst(window.innerWidth * 0.3, window.innerHeight * 0.4, 50);
                    window.confettiFX.burst(window.innerWidth * 0.7, window.innerHeight * 0.4, 50);
                }
                if (window.soundEngine) window.soundEngine.playCelebrationFanfare();
                break;
        }
    }

    // =========================================================================
    // LANGUAGE SWITCHER EVENTS
    // =========================================================================
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLanguage = btn.getAttribute('data-lang') || 'en';
            if (inputWishLang) inputWishLang.value = currentLanguage;
            renderAllContent();
            updateShareLinkField();
            if (window.soundEngine) window.soundEngine.playSparkle();
        });
    });

    // =========================================================================
    // CUSTOM MEMORIES PHOTOS & CANDLE RESET CONTROLLER
    // =========================================================================
    const photoPreviewsStrip = document.getElementById('photo-previews-strip');
    const inputCustomPhotos = document.getElementById('input-custom-photos');
    const btnResetPhotos = document.getElementById('btn-reset-photos');
    const btnAddPhotosStage2 = document.getElementById('btn-add-photos-stage2');

    function updatePhotoPreviewsStrip() {
        if (!photoPreviewsStrip) return;
        photoPreviewsStrip.innerHTML = '';
        customPhotos.forEach((photo, idx) => {
            const item = document.createElement('div');
            item.className = 'photo-preview-item';
            item.innerHTML = `
                <img src="${photo.url}" alt="Preview ${idx + 1}">
                <button type="button" class="photo-preview-remove" data-index="${idx}" title="Remove photo">&times;</button>
            `;
            photoPreviewsStrip.appendChild(item);
        });

        photoPreviewsStrip.querySelectorAll('.photo-preview-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                customPhotos.splice(idx, 1);
                saveCustomPhotos();
                updatePhotoPreviewsStrip();
                renderAllContent();
            });
        });
    }

    function saveCustomPhotos() {
        try {
            localStorage.setItem('birthday_custom_photos', JSON.stringify(customPhotos));
        } catch(e) {}
    }

    function renderMemoriesGallery(langData) {
        if (!customPhotos || customPhotos.length === 0) return;

        const cards = document.querySelectorAll('.polaroid-card');
        cards.forEach((card, idx) => {
            const imgEl = card.querySelector('img');
            const capEl = card.querySelector('.polaroid-caption');
            const custom = customPhotos[idx] || customPhotos[0];

            let imgSrc = custom.url;
            let captionText = custom.caption || `Memory with ${recipientName} ✨`;
            let noteText = custom.note || `Special Celebration Moment ❤️`;

            if (imgEl) imgEl.src = imgSrc;
            if (capEl) capEl.textContent = captionText;
            card.setAttribute('data-img', imgSrc);
            card.setAttribute('data-caption', noteText);
        });
    }

    if (inputCustomPhotos) {
        inputCustomPhotos.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            const remainingSlots = 3 - customPhotos.length;
            const filesToProcess = files.slice(0, remainingSlots > 0 ? remainingSlots : 3);

            if (remainingSlots <= 0) {
                customPhotos = [];
            }

            filesToProcess.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let w = img.width;
                        let h = img.height;
                        const maxDim = 800;
                        if (w > maxDim || h > maxDim) {
                            if (w > h) {
                                h = Math.round((h * maxDim) / w);
                                w = maxDim;
                            } else {
                                w = Math.round((w * maxDim) / h);
                                h = maxDim;
                            }
                        }
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

                        customPhotos.push({
                            url: optimizedDataUrl,
                            caption: `Moments with ${recipientName} ✨`,
                            note: `Captured with love ❤️`
                        });

                        if (customPhotos.length > 3) customPhotos = customPhotos.slice(0, 3);
                        saveCustomPhotos();
                        updatePhotoPreviewsStrip();
                        renderAllContent();
                        showToast('Custom photo added! 📸✨');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
            inputCustomPhotos.value = '';
        });
    }

    if (btnResetPhotos) {
        btnResetPhotos.addEventListener('click', () => {
            customPhotos = [];
            try {
                localStorage.removeItem('birthday_custom_photos');
            } catch(e) {}
            updatePhotoPreviewsStrip();
            renderAllContent();
            showToast('Photos cleared! Memories tab disabled until photos are added. 📸');
        });
    }

    if (btnAddPhotosStage2) {
        btnAddPhotosStage2.addEventListener('click', () => {
            showCreateStage();
            setTimeout(() => {
                const dropzone = document.querySelector('.photo-upload-dropzone');
                if (dropzone) dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        });
    }

    // Reset Candles & Envelope state so candles are always ON for new wishes
    function resetCandlesAndSurprises() {
        candlesBlown = false;
        envelopeOpened = false;
        const candleEls = document.querySelectorAll('.candle');
        candleEls.forEach(candle => {
            candle.classList.remove('extinguished');
        });
        const cHint = document.getElementById('cake-status-hint');
        const cWishBanner = document.getElementById('cake-wish-banner');
        const envWrap = document.getElementById('secret-envelope');
        if (cHint) cHint.style.display = 'flex';
        if (cWishBanner) cWishBanner.style.display = 'none';
        if (envWrap) envWrap.classList.remove('open');
    }

    // =========================================================================
    // GENERATE PERSONALIZED WISH, PREVIEW MODE & SEND WISH MODAL CONTROLLER
    // =========================================================================
    let isPreviewMode = false;
    const btnGenerateWishNav = document.getElementById('btn-generate-wish');
    const btnGenerateWishFooter = document.getElementById('btn-generate-wish-footer');
    const btnSendWishNav = document.getElementById('btn-send-wish-nav');
    const btnStage0SendWish = document.getElementById('btn-stage0-send-wish');
    const btnFinaleSendWish = document.getElementById('btn-finale-send-wish');
    const createWishForm = document.getElementById('create-wish-form');
    const inputBdayName = document.getElementById('input-bday-name');
    const inputSenderName = document.getElementById('input-sender-name');
    const inputWishLang = document.getElementById('input-wish-lang');
    const inputCustomMsg = document.getElementById('input-custom-msg');
    const outputShareLink = document.getElementById('output-share-link');
    const btnPreviewGeneratedWish = document.getElementById('btn-preview-generated-wish');
    const toastNotice = document.getElementById('toast-notice');

    // Floating Preview Bar Elements
    const previewModeBar = document.getElementById('preview-mode-bar');
    const previewRecipientName = document.getElementById('preview-recipient-name');
    const btnPreviewBarSend = document.getElementById('btn-preview-bar-send');
    const btnPreviewBarEdit = document.getElementById('btn-preview-bar-edit');

    // Send Wish Modal Elements
    const sendWishModal = document.getElementById('send-wish-modal');
    const btnCloseSendModal = document.getElementById('btn-close-send-modal');
    const sendModalHeading = document.getElementById('send-modal-heading');
    const sendModalSubheading = document.getElementById('send-modal-subheading');
    const modalShareLinkInput = document.getElementById('modal-share-link-input');
    const btnModalCopyLink = document.getElementById('btn-modal-copy-link');
    const btnModalWhatsapp = document.getElementById('btn-modal-whatsapp');
    const btnModalTelegram = document.getElementById('btn-modal-telegram');
    const btnModalInstagram = document.getElementById('btn-modal-instagram');
    const btnModalSms = document.getElementById('btn-modal-sms');
    const btnModalNative = document.getElementById('btn-modal-native');
    const btnModalBackEdit = document.getElementById('btn-modal-back-edit');

    // Generator Form Share buttons
    const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
    const btnShareTelegram = document.getElementById('btn-share-telegram');
    const btnShareInstagram = document.getElementById('btn-share-instagram');
    const btnShareSms = document.getElementById('btn-share-sms');
    const btnCopyUrl = document.getElementById('btn-copy-url');
    const btnShareNative = document.getElementById('btn-share-native');

    function buildCleanShareUrl(bName, sName, langCode, cMsg) {
        const baseUrl = window.location.origin + window.location.pathname;
        const payload = {
            r: bName || recipientName,
            s: sName || senderName,
            l: langCode || currentLanguage,
            m: cMsg ? cMsg.trim() : ''
        };
        const encoded = encodeWishPayload(payload);
        return `${baseUrl}?w=${encoded}`;
    }

    function updateShareLinkField() {
        const bName = (inputBdayName && inputBdayName.value.trim()) || recipientName || 'Friend';
        const sName = (inputSenderName && inputSenderName.value.trim()) || senderName || 'Your Friend';
        const langCode = (inputWishLang && inputWishLang.value) || currentLanguage;
        const cMsg = inputCustomMsg ? inputCustomMsg.value.trim() : '';
        const url = buildCleanShareUrl(bName, sName, langCode, cMsg);
        if (outputShareLink) outputShareLink.value = url;
        if (modalShareLinkInput) modalShareLinkInput.value = url;
    }

    // Open & Close Send Wish Modal
    function openSendWishModal() {
        if (!sendWishModal) return;
        const bName = recipientName || 'Friend';
        const sName = senderName || 'Your Friend';
        const shareUrl = buildCleanShareUrl(bName, sName, currentLanguage, customMsg);

        if (sendModalHeading) {
            sendModalHeading.textContent = `Send Wish to ${bName} 🎁`;
        }
        if (sendModalSubheading) {
            sendModalSubheading.textContent = `Your personalized birthday celebration from ${sName} to ${bName} is ready! Send it directly:`;
        }
        if (modalShareLinkInput) {
            modalShareLinkInput.value = shareUrl;
        }

        sendWishModal.classList.add('active');
        if (window.soundEngine) window.soundEngine.playSparkle();
    }

    function closeSendWishModal() {
        if (sendWishModal) sendWishModal.classList.remove('active');
    }

    if (btnCloseSendModal) btnCloseSendModal.addEventListener('click', closeSendWishModal);
    if (sendWishModal) {
        sendWishModal.addEventListener('click', (e) => {
            if (e.target === sendWishModal) closeSendWishModal();
        });
    }

    // Wire "Send This Wish" action triggers
    if (btnSendWishNav) btnSendWishNav.addEventListener('click', openSendWishModal);
    if (btnStage0SendWish) btnStage0SendWish.addEventListener('click', openSendWishModal);
    if (btnFinaleSendWish) btnFinaleSendWish.addEventListener('click', openSendWishModal);
    if (btnPreviewBarSend) btnPreviewBarSend.addEventListener('click', openSendWishModal);

    // Edit Wish actions from modal and preview bar
    if (btnPreviewBarEdit) {
        btnPreviewBarEdit.addEventListener('click', () => {
            showCreateStage(true);
        });
    }
    if (btnModalBackEdit) {
        btnModalBackEdit.addEventListener('click', () => {
            closeSendWishModal();
            showCreateStage(true);
        });
    }

    if (btnGenerateWishNav) btnGenerateWishNav.addEventListener('click', () => showCreateStage(false));
    if (btnGenerateWishFooter) btnGenerateWishFooter.addEventListener('click', () => showCreateStage(false));

    // Live update share link on any field input
    [inputBdayName, inputSenderName, inputWishLang, inputCustomMsg].forEach(input => {
        if (input) {
            input.addEventListener('input', updateShareLinkField);
            input.addEventListener('change', () => {
                if (input === inputWishLang) {
                    currentLanguage = inputWishLang.value;
                    renderAllContent();
                }
                updateShareLinkField();
            });
        }
    });

    // Form Submit: Generate Wish, Persist locally, Relight Candles & Live Preview
    if (createWishForm) {
        createWishForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bName = inputBdayName ? inputBdayName.value.trim() : '';
            const sName = inputSenderName ? inputSenderName.value.trim() : '';
            const langCode = inputWishLang ? inputWishLang.value : currentLanguage;
            const cMsg = inputCustomMsg ? inputCustomMsg.value.trim() : '';

            if (!bName || !sName) {
                showToast('Please enter both names! ✨');
                return;
            }

            recipientName = bName;
            senderName = sName;
            currentLanguage = langCode;
            customMsg = cMsg || null;

            // Save to localStorage
            try {
                localStorage.setItem('birthday_user_wish', JSON.stringify({
                    to: recipientName,
                    from: senderName,
                    msg: customMsg,
                    lang: currentLanguage
                }));
            } catch(e) {}

            resetCandlesAndSurprises();
            updateShareLinkField();
            renderAllContent();

            // Show success banner
            const successBanner = document.getElementById('generated-success-banner');
            const successText = document.getElementById('generated-success-text');
            if (successBanner && successText) {
                successText.textContent = `🎉 Surprise Ready for ${recipientName}! Share the link below or preview it:`;
                successBanner.style.display = 'block';
            }

            if (window.soundEngine) window.soundEngine.playCelebrationFanfare();
            if (window.confettiFX) {
                window.confettiFX.cannon(true);
                setTimeout(() => window.confettiFX.cannon(false), 300);
            }

            showToast(`✨ Birthday surprise generated for ${recipientName}! 🎁`);
        });
    }

    // Preview Generated Wish button: Enter Preview Mode
    if (btnPreviewGeneratedWish) {
        btnPreviewGeneratedWish.addEventListener('click', () => {
            const bName = inputBdayName ? inputBdayName.value.trim() : '';
            const sName = inputSenderName ? inputSenderName.value.trim() : '';

            if (!bName || !sName) {
                showToast('Please enter both names first! ✨');
                if (inputBdayName && !bName) inputBdayName.focus();
                else if (inputSenderName && !sName) inputSenderName.focus();
                return;
            }

            recipientName = bName;
            senderName = sName;
            if (inputWishLang) currentLanguage = inputWishLang.value;
            if (inputCustomMsg) customMsg = inputCustomMsg.value.trim() || null;

            isPreviewMode = true;
            if (previewModeBar) {
                previewModeBar.style.display = 'block';
                if (previewRecipientName) previewRecipientName.textContent = recipientName;
            }

            resetCandlesAndSurprises();
            renderAllContent();
            if (window.soundEngine) window.soundEngine.startMusic();
            goToStageIndex(0);
            triggerBoomReveal();
            showToast(`👁️ Previewing wish for ${recipientName}! Tap "Send Wish" whenever you are ready. ✨`);
        });
    }

    // Toast Notice Helper
    function showToast(text = 'Saved! ✨') {
        if (!toastNotice) return;
        toastNotice.textContent = text;
        toastNotice.classList.add('show');
        setTimeout(() => toastNotice.classList.remove('show'), 2800);
    }

    function getShareText(bName, sName) {
        return `🎂 Happy Birthday, ${bName}! 🎉\n\n${sName} has created a special, heartfelt birthday surprise journey just for you! ✨\n\nOpen your birthday celebration here:`;
    }

    // Helper to share via WhatsApp
    function shareViaWhatsApp(link, bName, sName) {
        const text = `${getShareText(bName, sName)}\n${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    // Helper to share via Telegram
    function shareViaTelegram(link, bName, sName) {
        const text = `🎂 Happy Birthday, ${bName}! 🎉 A personalized birthday celebration from ${sName} ❤️`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
    }

    // Helper to share via Instagram Direct
    function shareViaInstagram(link, bName) {
        navigator.clipboard.writeText(link).then(() => {
            showToast(`Link copied! Open Instagram to paste for ${bName} 📸✨`);
        }).catch(() => {
            showToast('Link ready in input box!');
        });
        setTimeout(() => {
            window.open('https://www.instagram.com/direct/inbox/', '_blank');
        }, 500);
    }

    // Helper to share via SMS
    function shareViaSms(link, bName, sName) {
        const text = `🎂 Happy Birthday, ${bName}! 🎉 Special surprise from ${sName}: ${link}`;
        window.open(`sms:?&body=${encodeURIComponent(text)}`, '_blank');
    }

    // Helper for Native Share sheet
    function shareViaNative(link, bName, sName) {
        const text = `🎂 Happy Birthday, ${bName}! 🎉 ${sName} has created a special interactive birthday celebration for you! ✨`;
        if (navigator.share) {
            navigator.share({
                title: `Happy Birthday, ${bName}! 🎉`,
                text: text,
                url: link
            }).then(() => {
                showToast('Shared successfully! ✨');
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(link).then(() => {
                showToast('Link copied! Send it via any app 📋✨');
            });
        }
    }

    // Attach Generator Form Share button handlers
    if (btnShareWhatsapp) {
        btnShareWhatsapp.addEventListener('click', () => {
            const bName = inputBdayName.value.trim() || recipientName;
            const sName = inputSenderName.value.trim() || senderName;
            shareViaWhatsApp(outputShareLink.value, bName, sName);
        });
    }

    if (btnShareTelegram) {
        btnShareTelegram.addEventListener('click', () => {
            const bName = inputBdayName.value.trim() || recipientName;
            const sName = inputSenderName.value.trim() || senderName;
            shareViaTelegram(outputShareLink.value, bName, sName);
        });
    }

    if (btnShareInstagram) {
        btnShareInstagram.addEventListener('click', () => {
            const bName = inputBdayName.value.trim() || recipientName;
            shareViaInstagram(outputShareLink.value, bName);
        });
    }

    if (btnShareSms) {
        btnShareSms.addEventListener('click', () => {
            const bName = inputBdayName.value.trim() || recipientName;
            const sName = inputSenderName.value.trim() || senderName;
            shareViaSms(outputShareLink.value, bName, sName);
        });
    }

    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            outputShareLink.select();
            navigator.clipboard.writeText(outputShareLink.value).then(() => {
                showToast(`Share link copied! 📋✨`);
                if (window.soundEngine) window.soundEngine.playSparkle();
            }).catch(() => {
                showToast('Link ready in input box!');
            });
        });
    }

    if (btnShareNative) {
        btnShareNative.addEventListener('click', () => {
            const bName = inputBdayName.value.trim() || recipientName;
            const sName = inputSenderName.value.trim() || senderName;
            shareViaNative(outputShareLink.value, bName, sName);
        });
    }

    // Attach Modal Share button handlers
    if (btnModalCopyLink) {
        btnModalCopyLink.addEventListener('click', () => {
            const link = modalShareLinkInput ? modalShareLinkInput.value : buildCleanShareUrl(recipientName, senderName, currentLanguage, customMsg);
            navigator.clipboard.writeText(link).then(() => {
                showToast(`Share link copied! 📋✨`);
                if (window.soundEngine) window.soundEngine.playSparkle();
            }).catch(() => {
                showToast('Link ready in input box!');
            });
        });
    }

    if (btnModalWhatsapp) {
        btnModalWhatsapp.addEventListener('click', () => {
            const link = modalShareLinkInput ? modalShareLinkInput.value : buildCleanShareUrl(recipientName, senderName, currentLanguage, customMsg);
            shareViaWhatsApp(link, recipientName, senderName);
        });
    }

    if (btnModalTelegram) {
        btnModalTelegram.addEventListener('click', () => {
            const link = modalShareLinkInput ? modalShareLinkInput.value : buildCleanShareUrl(recipientName, senderName, currentLanguage, customMsg);
            shareViaTelegram(link, recipientName, senderName);
        });
    }

    if (btnModalInstagram) {
        btnModalInstagram.addEventListener('click', () => {
            const link = modalShareLinkInput ? modalShareLinkInput.value : buildCleanShareUrl(recipientName, senderName, currentLanguage, customMsg);
            shareViaInstagram(link, recipientName);
        });
    }

    if (btnModalSms) {
        btnModalSms.addEventListener('click', () => {
            const link = modalShareLinkInput ? modalShareLinkInput.value : buildCleanShareUrl(recipientName, senderName, currentLanguage, customMsg);
            shareViaSms(link, recipientName, senderName);
        });
    }

    if (btnModalNative) {
        btnModalNative.addEventListener('click', () => {
            const link = modalShareLinkInput ? modalShareLinkInput.value : buildCleanShareUrl(recipientName, senderName, currentLanguage, customMsg);
            shareViaNative(link, recipientName, senderName);
        });
    }

    // =========================================================================
    // STAGE INTERACTION HANDLERS
    // =========================================================================
    const audioToggle = document.getElementById('audio-toggle');
    const audioStatusText = document.getElementById('audio-status-text');
    const btnStart = document.getElementById('btn-start-journey');
    const nextButtons = document.querySelectorAll('.stage-next-btn');
    const btnRestart = document.getElementById('btn-restart-journey');
    const btnReplayFooter = document.getElementById('btn-replay-journey-footer');

    // Lightbox Elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');
    const polaroidCards = document.querySelectorAll('.polaroid-card');

    // Cake & Candles Elements
    const cakeContainer = document.getElementById('interactive-cake');
    const candleElements = document.querySelectorAll('.candle');
    const cakeHint = document.getElementById('cake-status-hint');
    const cakeWishBanner = document.getElementById('cake-wish-banner');

    // Envelope Elements
    const envelopeWrapper = document.getElementById('secret-envelope');

    // Cake Candle Blow
    function blowOutCandles() {
        if (candlesBlown) return;
        candlesBlown = true;

        if (window.soundEngine) window.soundEngine.playBlow();

        candleElements.forEach((candle, idx) => {
            setTimeout(() => candle.classList.add('extinguished'), idx * 120);
        });

        setTimeout(() => {
            if (window.confettiFX) {
                window.confettiFX.burst(window.innerWidth / 2, window.innerHeight * 0.45, 90);
            }
            if (window.soundEngine) window.soundEngine.playCelebrationFanfare();
            if (cakeHint) cakeHint.style.display = 'none';
            if (cakeWishBanner) cakeWishBanner.style.display = 'block';
        }, 500);
    }

    if (cakeContainer) {
        cakeContainer.addEventListener('click', blowOutCandles);
        cakeContainer.addEventListener('touchstart', blowOutCandles, { passive: true });
    }

    // Surprise Oracle & Mystery Gift Box Interaction
    const oracleButtons = document.querySelectorAll('.oracle-card-btn');
    const mysteryGiftRevealWrap = document.getElementById('mystery-gift-reveal-wrap');
    const revealedFortuneText = document.getElementById('revealed-fortune-text');
    const mysteryGiftBox = document.getElementById('mystery-gift-box');

    oracleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            oracleButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const wishKey = btn.getAttribute('data-wish') || 'success';
            const langData = contentDictionary[currentLanguage] || contentDictionary.en;
            const revealFn = (langData.oracleReveals && langData.oracleReveals[wishKey]) || contentDictionary.en.oracleReveals[wishKey];
            
            if (revealedFortuneText && revealFn) {
                revealedFortuneText.innerHTML = revealFn(recipientName, senderName).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
            }

            if (mysteryGiftRevealWrap) {
                mysteryGiftRevealWrap.style.display = 'block';
                mysteryGiftRevealWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            if (window.soundEngine) {
                window.soundEngine.playCelebrationFanfare();
            }
            if (window.confettiFX) {
                window.confettiFX.burst(window.innerWidth / 2, window.innerHeight * 0.5, 60);
            }
        });
    });

    if (mysteryGiftBox) {
        mysteryGiftBox.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playSparkle();
            if (window.confettiFX) window.confettiFX.burst(window.innerWidth / 2, window.innerHeight * 0.5, 40);
        });
    }

    // Secret Envelope Unseal
    function toggleEnvelope() {
        if (!envelopeWrapper) return;
        if (!envelopeOpened) {
            envelopeOpened = true;
            envelopeWrapper.classList.add('open');
            if (window.soundEngine) window.soundEngine.playEnvelopeOpen();
            if (window.confettiFX) {
                window.confettiFX.burst(window.innerWidth / 2, window.innerHeight * 0.5, 40);
            }
        } else {
            envelopeOpened = false;
            envelopeWrapper.classList.remove('open');
        }
    }

    if (envelopeWrapper) envelopeWrapper.addEventListener('click', toggleEnvelope);

    // Polaroid Lightbox
    polaroidCards.forEach(card => {
        card.addEventListener('click', () => {
            const imgPath = card.getAttribute('data-img');
            const captionText = card.getAttribute('data-caption');
            if (!imgPath) return;
            lightboxImg.src = imgPath;
            lightboxCaption.textContent = captionText || '';
            lightboxModal.classList.add('active');
            if (window.soundEngine) window.soundEngine.playSparkle();
        });
    });

    if (btnCloseLightbox) {
        btnCloseLightbox.addEventListener('click', () => lightboxModal.classList.remove('active'));
    }
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) lightboxModal.classList.remove('active');
        });
    }

    // Audio HUD
    if (audioToggle) {
        audioToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.soundEngine) {
                const isMuted = window.soundEngine.toggleMute();
                audioToggle.classList.toggle('muted', isMuted);
                if (audioStatusText) {
                    audioStatusText.textContent = isMuted ? 'Music OFF' : 'Music ON';
                }
            }
        });
    }

    // Start Journey & Navigation
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.startMusic();
            goToStageIndex(1);
        });
    }

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => goToStageIndex(currentStageIndex + 1));
    });

    function restartJourney() {
        resetCandlesAndSurprises();
        goToStageIndex(0);
    }

    if (btnRestart) btnRestart.addEventListener('click', restartJourney);
    if (btnReplayFooter) btnReplayFooter.addEventListener('click', restartJourney);

    // Start Heart Balloons and Ambient Hearts
    if (window.balloonManager) {
        window.balloonManager.startContinuousSpawn(1800);
    }
    if (window.heartsFX) {
        window.heartsFX.start(1400);
    }

    // Cursor Sparkles
    let lastSparkleTime = 0;
    window.addEventListener('pointermove', (e) => {
        const now = Date.now();
        if (now - lastSparkleTime > 75) {
            lastSparkleTime = now;
            const spark = document.createElement('div');
            spark.className = 'interactive-sparkle';
            spark.style.left = `${e.clientX}px`;
            spark.style.top = `${e.clientY}px`;
            const colors = ['#ffd166', '#ff70a6', '#06d6a0', '#ff9770', '#e2afff'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            spark.style.backgroundColor = randomColor;
            spark.style.boxShadow = `0 0 8px ${randomColor}`;
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 600);
        }
    });

    // Keyboard Navigation (Supports Enter ↵, Space, Arrow keys, Escape)
    window.addEventListener('keydown', (e) => {
        const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

        if (inGeneratorView) {
            if (e.key === 'Escape') {
                if (lightboxModal && lightboxModal.classList.contains('active')) lightboxModal.classList.remove('active');
                if (sendWishModal && sendWishModal.classList.contains('active')) sendWishModal.classList.remove('active');
            }
            return;
        }

        if (isInputFocused && e.key === 'Enter') return;

        if (e.key === 'Escape') {
            if (lightboxModal && lightboxModal.classList.contains('active')) lightboxModal.classList.remove('active');
            if (sendWishModal && sendWishModal.classList.contains('active')) sendWishModal.classList.remove('active');
            return;
        }

        if ((lightboxModal && lightboxModal.classList.contains('active')) ||
            (sendWishModal && sendWishModal.classList.contains('active'))) {
            return;
        }

        const activeIds = getActiveStageIds();

        // Forward Navigation: Enter ↵, Space, ArrowRight, PageDown
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault();
            if (window.soundEngine && currentStageIndex === 0) {
                window.soundEngine.startMusic();
            }
            if (currentStageIndex < activeIds.length - 1) {
                goToStageIndex(currentStageIndex + 1);
            } else if (currentStageIndex === activeIds.length - 1) {
                restartJourney();
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            if (currentStageIndex > 0) {
                goToStageIndex(currentStageIndex - 1);
            }
        }
    });

    // =========================================================================
    // MOBILE TAP ON SCREEN & TOUCH SWIPE NAVIGATION
    // =========================================================================
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const interactiveSelectors = [
        'button', 'input', 'textarea', 'select', 'label', 'a',
        '.social-share-btn', '.audio-hud', '.lang-btn', '#lang-selector',
        '.preview-mode-bar', '.custom-modal-card', '.lightbox-content',
        '.candle', '#interactive-cake', '.oracle-card-btn', '#mystery-gift-box',
        '#secret-envelope', '.polaroid-card', '.photo-preview-item', '.photo-upload-dropzone',
        '.photo-upload-box', '.bday-wish-tag', '.step-dot'
    ].join(', ');

    window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (inGeneratorView) return;

        // If modal or lightbox is active, do not trigger background tap navigation
        if ((lightboxModal && lightboxModal.classList.contains('active')) ||
            (sendWishModal && sendWishModal.classList.contains('active'))) {
            return;
        }

        if (!e.changedTouches || e.changedTouches.length !== 1) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const duration = Date.now() - touchStartTime;

        // Ignore touches on interactive components (buttons, candles, envelopes, inputs, etc.)
        const target = e.target;
        if (target && target.closest(interactiveSelectors)) {
            return;
        }

        const activeIds = getActiveStageIds();

        // 1. Horizontal Swipe (Swipe Left = Next, Swipe Right = Prev)
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && duration < 600) {
            if (deltaX < 0) {
                // Swiped Left -> Move to Next Stage
                if (window.soundEngine && currentStageIndex === 0) {
                    window.soundEngine.startMusic();
                }
                if (currentStageIndex < activeIds.length - 1) {
                    goToStageIndex(currentStageIndex + 1);
                }
            } else if (deltaX > 0) {
                // Swiped Right -> Move to Prev Stage
                if (currentStageIndex > 0) {
                    goToStageIndex(currentStageIndex - 1);
                }
            }
            return;
        }

        // 2. Tap on Screen (Quick tap with minimal displacement)
        if (Math.abs(deltaX) < 16 && Math.abs(deltaY) < 16 && duration < 400) {
            if (window.soundEngine && currentStageIndex === 0) {
                window.soundEngine.startMusic();
            }
            if (currentStageIndex < activeIds.length - 1) {
                goToStageIndex(currentStageIndex + 1);
            }
        }
    }, { passive: true });

    // Initial Setup
    resetCandlesAndSurprises();
    renderAllContent();
    if (inGeneratorView) {
        showCreateStage();
    } else {
        goToStageIndex(0);
    }
});
