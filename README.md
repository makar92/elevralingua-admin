# LinguaMethod Admin Panel

Админ-панель для создания учебного контента.

## Стек

- Next.js 15 (App Router)
- Prisma 6 (ORM)
- PostgreSQL
- Tailwind CSS 4
- NextAuth v5 (авторизация)

## Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Настройка .env

Файл `.env` уже в проекте. Если пароль PostgreSQL не `postgres` — замени:

```
DATABASE_URL="postgresql://postgres:ТВОЙ_ПАРОЛЬ@localhost:5432/linguamethod"
```

### 3. База данных

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Запуск

```bash
npm run dev
```

Открыть: http://localhost:3000

**Логин:** ksenia@linguamethod.com
**Пароль:** admin123
# elevralingua-admin
