# TEST COVERAGE

> Статусы:
>
> ✅ — автоматизировано
> 🚧 — в процессе
> ❌ — не автоматизировано
> ⚠️ — нестабильный тест
> 🔥 — высокий приоритет
> 💤 — низкий приоритет

---

# API

## Auth

| Scenario | Status | Test File |
|----------|----------|----------|
| Login valid user | ✅ | tests/ui/auth/auth.spec.js |
| Login invalid password | ✅ | tests/ui/auth/auth.spec.js |
| Logout | ✅ | tests/ui/auth/auth.spec.js |
| Refresh token | ❌ | - |

---

## Todos

| Scenario | Status | Test File |
|----------|---|---|
| Create todo | ✅ | tests/api/todos/todos.create.spec.js |
| Get all todos | ✅ | tests/api/todos/todos.get.spec.js |
| Get todo by id | ✅ | tests/api/todos/todos.get.spec.js |
| Update todo | 🚧 | tests/api/todos/todos.update.spec.js |
| Delete todo | ❌ | tests/api/todos/todos.delete.spec.js |

---

# UI

## Auth Page

| Scenario | Status | Test File |
|----------|----------|----------|
| log in/out successful | ✅ | tests/ui/auth/auth.spec.js |
| wrong credentials | ✅ | tests/ui/auth/auth.spec.js |
| empty from validation | ✅ | tests/ui/auth/auth.spec.js |
| open auth page successful | ✅ | tests/ui/auth/auth.spec.js |
---

## Dashboard

| Scenario | Status | Test File |
|----------|----------|----------|
| Open dashboard | ✅ | tests/ui/dashboard/calc.spec.js |
| search order - empty state | ✅ | tests/ui/dashboard/calc.spec.js |
| search order - valid state | ✅ | tests/ui/dashboard/calc.spec.js |
| search order - clear state | ✅ | tests/ui/dashboard/calc.spec.js |
| create order | ⚠️ | tests/ui/dashboard/calc.spec.js |

---

# Smoke

| Scenario | Status | Test File |
|----------|----------|----------|
| API smoke | ✅ | tests/smoke/smoke.api.spec.js |
| UI smoke | ✅ | tests/smoke/smoke.ui.spec.js |

---

# Notes

- Все новые API тесты добавлять в `tests/api`
- Все UI тесты добавлять в `tests/ui`
- Smoke тесты должны проходить < 10 минут
- Нестабильные тесты помечать ⚠️