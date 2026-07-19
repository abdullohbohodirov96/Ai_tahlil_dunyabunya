# JARVIS — Vercel'ga deploy qilish qo'llanmasi

Bu versiya to'liq Vercel'ga mos qilib qayta qurilgan: **Next.js** (frontend +
API bir loyihada), **Postgres** (SQLite o'rniga), **Telegram webhook**
(doimiy polling o'rniga). Men buni shu yerda to'liq ishga tushirib,
login, xodim qo'shish, Sheets sync, statistika, AI-assistent va Telegram
webhook'ni haqiqatan test qilib ko'rdim — barchasi ishlaydi.

**Muhim: men (Claude) sizning Vercel akkauntingizga shaxsan kira olmayman**
— buning uchun brauzer/login imkoniyatim yo'q. Lekin quyidagi qadamlar
5-10 daqiqada, hech qanday dasturlash bilmasangiz ham bajariladigan
darajada oddiy.

---

## Sizga kerak bo'ladigan narsalar

| # | Nima | Qayerdan olinadi | Majburiymi? |
|---|---|---|---|
| 1 | GitHub akkaunt | github.com | Ha (Vercel shu orqali deploy qiladi) |
| 2 | Vercel akkaunt | vercel.com (GitHub bilan kirish mumkin) | Ha |
| 3 | Postgres baza | neon.tech (bepul, tavsiya etiladi) yoki Vercel Postgres | Ha |
| 4 | Telegram bot tokeni | @BotFather'dan `/newbot` | Ixtiyoriy — bo'lmasa Telegram bo'limi ishlamaydi |
| 5 | Google Sheets kalit | Google Cloud Console | Ixtiyoriy — bo'lmasa demo lead'lar ko'rinadi |
| 6 | Anthropic API kalit | console.anthropic.com | Ixtiyoriy — bo'lmasa AI-assistent oddiy raqamli javob beradi |
| 7 | Meta/Instagram token | Meta Business Suite | Ixtiyoriy — bo'lmasa demo raqamlar ko'rinadi |

**Eng muhimi — #1, #2, #3 siz tizim umuman ishlamaydi.** Qolganlari
bo'lmasa ham tizim to'liq ishlaydi, faqat demo ma'lumot ko'rsatadi.

---

## Qadam 1 — Postgres baza yaratish (Neon, bepul)

1. https://neon.tech ga kiring, "Sign up" (GitHub bilan kirsa bo'ladi)
2. Yangi loyiha yarating (masalan "jarvis")
3. Dashboard'da **Connection string** ni nusxalang — bunday ko'rinishda:
   `postgres://user:password@ep-xxx.neon.tech/neondb?sslmode=require`
4. Buni saqlab qo'ying — Qadam 4 va 5 da kerak bo'ladi.

## Qadam 2 — Kodni GitHub'ga yuklash

Loyihani zipdan ochib, terminalda:

```bash
cd jarvis-vercel
git init
git add .
git commit -m "JARVIS MVP"
```

GitHub'da yangi bo'sh repository yarating (masalan `jarvis-business`),
keyin:

```bash
git remote add origin https://github.com/<username>/jarvis-business.git
git branch -M main
git push -u origin main
```

## Qadam 3 — Vercel'da loyihani import qilish

1. https://vercel.com/new ga kiring
2. GitHub'dagi `jarvis-business` repositoryni tanlang → **Import**
3. Framework avtomatik "Next.js" deb aniqlanadi — hech narsa o'zgartirmang
4. **Deploy** tugmasini bosishdan oldin pastdagi "Environment Variables"
   bo'limini oching va quyidagilarni qo'shing:

| Kalit | Qiymat |
|---|---|
| `DATABASE_URL` | Qadam 1'dagi Neon connection string |
| `JWT_SECRT` yo'q, `JWT_SECRET` | O'zingiz o'ylab topgan uzun maxfiy so'z |

5. **Deploy** ni bosing. 1-2 daqiqada loyiha `https://jarvis-business-xxxx.vercel.app`
   manzilida jonli bo'ladi.

## Qadam 4 — Bazani tayyorlash (jadvallar + admin foydalanuvchi)

Bu — **kompyuteringizda, bir marta** bajariladigan qadam (Vercel'da emas,
chunki bu doimiy jarayon emas, faqat sozlash):

```bash
cd jarvis-vercel
npm install
echo "DATABASE_URL=<Qadam-1-dagi-connection-string>" > .env
npm run db:init
```

Muvaffaqiyatli bo'lsa: `✅ Admin yaratildi -> login: admin / parol: admin123`
degan xabar chiqadi. Endi `https://jarvis-business-xxxx.vercel.app` ga kirib,
shu login bilan tizimga kirishingiz mumkin.

**Birinchi ishingiz — admin parolini almashtirish** (hozircha buni faqat
bazada to'g'ridan-to'g'ri SQL orqali yoki keyinroq qo'shiladigan "parolni
almashtirish" funksiyasi orqali qilasiz; so'rasangiz shuni ham qo'shib beraman).

## Qadam 5 — Telegram botni ulash (ixtiyoriy)

1. Telegram'da @BotFather ga `/newbot` yuboring, tokenni oling
2. Vercel loyihasi → **Settings → Environment Variables** →
   `TELEGRAM_BOT_TOKEN` qo'shing → **Save** → **Deployments** bo'limidan
   oxirgi deploy'ni **Redeploy** qiling (env o'zgargach qayta deploy shart)
3. Botni webhook rejimiga ulash uchun **bitta marta**, kompyuteringizdan:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://jarvis-business-xxxx.vercel.app/api/telegram/webhook"
```

(`<TOKEN>` va domenni o'zingiznikiga almashtiring). Javobda
`{"ok":true,"result":true}` chiqsa — bot ulandi. Endi botga `/start`
bossangiz, foydalanuvchi web-panelning Telegram bo'limida ko'rinadi.

## Qadam 6 — Qolgan API kalitlar (ixtiyoriy)

Xuddi Qadam 5'dagidek — Vercel → Settings → Environment Variables →
kerakli kalitni qo'shish → Redeploy:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — service account JSON faylining
  **to'liq mazmunini** (bir butun matn sifatida) joylashtiring
- `SALES_SHEET_ID`, `SALES_SHEET_RANGE`
- `META_ADS_ACCESS_TOKEN`, `META_ADS_ACCOUNT_ID`
- `IG_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (masalan `claude-sonnet-5`)

---

## Nima ishlaydi, nima hali demo rejimida

✅ **To'liq ishlaydi (men shu yerda test qildim):** login/rollar, xodim
qo'shish, Sheets sync + round-robin taqsimot, sotuv statistikasi,
Telegram webhook (/start, vazifalar), ruxsatlar UI, admin panel.

🟡 **Kalit qo'yilmaguncha demo ma'lumot ko'rsatadi:** Target (Meta Ads),
SMM (Instagram), AI-assistent (raqamli oddiy javob beradi, lekin to'liq
suhbat uchun Anthropic kaliti kerak).

## Muammo chiqsa

- **"DATABASE_URL sozlanmagan" xatosi** — Vercel Environment Variables'da
  yozilganiga va **Redeploy** qilinganiga ishonch hosil qiling (env
  o'zgarishi avtomatik qayta deploy qilmaydi).
- **Telegram javob bermayapti** — `setWebhook` buyrug'i muvaffaqiyatli
  o'tganini tekshiring: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- **Build xatosi** — `npm run build` ni o'zingizda ishga tushirib, xato
  matnini menga yuboring, birga tuzatamiz.
