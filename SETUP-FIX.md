# ElevraLingua Classroom Fix — ОБЯЗАТЕЛЬНО ВЫПОЛНИТЬ

## После распаковки архива ОБЯЗАТЕЛЬНО выполни:

```bash
npx prisma generate
npx prisma db push
```

Затем перезапусти dev сервер:
```bash
# Остановить текущий (Ctrl+C)
npm run dev
```

**Без этих команд будет ошибка:**
```
TypeError: Cannot read properties of undefined (reading 'findMany')
```

Это потому что в schema.prisma добавлены новые модели, 
и Prisma Client нужно перегенерировать.
