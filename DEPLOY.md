# Деплой LinguaMethod Admin на Vercel + Neon

## Что изменено для деплоя

| Файл | Изменение |
|------|-----------|
| `package.json` | Добавлен `@vercel/blob`, скрипт `postinstall` для Prisma |
| `src/app/api/upload/route.ts` | Загрузка через Vercel Blob (продакшен) или ФС (dev) |
| `next.config.js` | Добавлен домен Vercel Blob для `<Image>` |
| `.gitignore` | Добавлены `.env.local`, `public/uploads/` |
| `.env.example` | Шаблон переменных окружения |

---

## Шаг 1: Создай базу данных в Neon

1. Зайди на [neon.tech](https://neon.tech) → Sign Up (через GitHub)
2. **Create Project** → имя: `linguamethod`, регион: `eu-central-1` (ближе к Европе)
3. Скопируй **Connection string** — это твой `DATABASE_URL`
   - Формат: `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

## Шаг 2: Залей изменения в GitHub

```bash
# Закоммить изменённые файлы
git add package.json src/app/api/upload/route.ts next.config.js .gitignore .env.example
git commit -m "feat: prepare for Vercel + Neon deploy"
git push
```

## Шаг 3: Подключи проект к Vercel

1. Зайди на [vercel.com](https://vercel.com) → Sign Up (через GitHub)
2. **Add New → Project** → выбери свой репозиторий
3. Vercel автоматически определит Next.js
4. **НЕ нажимай Deploy** пока не добавишь переменные

## Шаг 4: Переменные окружения в Vercel

В **Settings → Environment Variables** добавь:

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | Строка подключения из Neon (шаг 1) |
| `AUTH_SECRET` | Сгенерируй: `openssl rand -base64 32` |
| `AUTH_URL` | Оставь пустым — Vercel подставит автоматически |

## Шаг 5: Подключи Vercel Blob

1. В Vercel Dashboard → твой проект → **Storage**
2. **Create** → **Blob** → имя: `linguamethod-uploads`
3. Токен `BLOB_READ_WRITE_TOKEN` добавится автоматически

## Шаг 6: Деплой!

1. Нажми **Deploy** (или сделай новый push — Vercel задеплоит автоматически)
2. Дождись окончания билда

## Шаг 7: Инициализация базы данных

После первого деплоя нужно накатить схему и seed:

```bash
# Локально, с DATABASE_URL от Neon:
export DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Накатить схему
npx prisma db push

# Заполнить начальными данными
npm run db:seed
```

Или через **Vercel CLI**:
```bash
npx vercel env pull .env.local   # подтянет переменные с Vercel
npx prisma db push
npm run db:seed
```

## Шаг 8: Проверка

Открой URL от Vercel (формат: `https://linguamethod-admin-xxx.vercel.app`).

Логин:
- **Email:** `ksenia@linguamethod.com`
- **Пароль:** `admin123`

---

## Полезные команды

```bash
# Посмотреть БД через Prisma Studio
npx prisma studio

# Логи деплоя
npx vercel logs

# Передеплоить
git push   # автодеплой
```

## Бесплатные лимиты

| Сервис | Лимит |
|--------|-------|
| **Vercel** (Hobby) | 100 GB bandwidth, serverless functions, preview deploys |
| **Neon** (Free) | 0.5 GB storage, 1 compute, autosuspend 5 мин |
| **Vercel Blob** | 250 MB storage |

Для этапа разработки и демо учителю — более чем достаточно.
