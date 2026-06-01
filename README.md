# Diplom Autotests

Дипломный проект по автоматизации тестирования для приложения "Калькулятор КП".

Проект демонстрирует UI и API автотесты на Playwright с использованием Page Object, Service layer, генераторов тестовых данных, Allure Report и GitHub Actions.

## Стек

- JavaScript
- Playwright
- Allure Report 3
- Faker
- GitHub Actions

## Что покрыто

### UI

UI-тесты находятся в `tests/ui`.

Покрытие:

- авторизация;
- валидация формы авторизации;
- проверка ролевого доступа для администратора и менеджера;
- поиск КП;
- создание КП для разных калькуляторов.

В UI-тестах используются:

- Page Object: `src/pages`;
- компоненты: `src/components`;
- fixtures: `src/helpers/fixtures/fixture.js`;
- генератор данных: `src/helpers/builders/proposal.builder.js`.

### API

API-тесты находятся в `tests/api`.

Покрытие:

- получение `better-auth` токена администратора;
- создание пользователя;
- обновление роли пользователя;
- удаление пользователя.

В API-тестах используются:

- Controllers: `src/controllers`;
- Services: `src/services`;
- Facade: `src/helpers/facades/auth.facade.js`;
- генератор пользователей: `src/helpers/builders/user.builder.js`;
- теги HTTP-методов: `@POST`, `@GET`, `@PUT`, `@DELETE`.

## Структура проекта

```text
.
├── .github/workflows/           # GitHub Actions
├── scripts/                     # служебные скрипты
├── src/
│   ├── components/              # UI components
│   ├── controllers/             # API controllers
│   ├── helpers/
│   │   ├── builders/            # генераторы тестовых данных
│   │   ├── cleanup/             # очистка тестовых данных
│   │   ├── facades/             # фасады для сервисов
│   │   └── fixtures/            # Playwright fixtures
│   ├── pages/                   # Page Object
│   └── services/                # API service layer
├── tests/
│   ├── api/                     # API автотесты
│   ├── ui/                      # UI автотесты
│   └── global.teardown.js       # пост-очистка тестовых данных
├── allurerc.mjs                 # конфиг Allure Report 3
├── playwright.config.js         # конфиг Playwright
└── package.json
```

## Установка

```bash
npm ci
npx playwright install --with-deps
```

## Переменные окружения

По умолчанию тесты используют тестового администратора из проекта.

Можно переопределить данные через переменные окружения:

```bash
E2E_EMAIL=admin@example.com
E2E_PASSWORD=password
```

Файлы `.env` и `.env.*` добавлены в `.gitignore` и не должны попадать в репозиторий.

## Запуск тестов

Запустить все тесты:

```bash
npm test
```

Запустить Playwright UI mode:

```bash
npm run test:ui
```

Запустить только API-тесты:

```bash
npm run test:api
```

Запуск API-тестов по HTTP-тегам:

```bash
npm run test:api:post
npm run test:api:get
npm run test:api:put
npm run test:api:delete
```

## Allure Report

Сгенерировать Allure-отчёт и открыть его локально:

```bash
npm run test:report
```

Сгенерировать отчёт без открытия сервера:

```bash
npm run test:report -- --no-open
```

Открыть уже сгенерированный отчёт:

```bash
npm run allure:open
```

Локальная ссылка отчёта:

```text
http://localhost:9323
```

Allure results и report не коммитятся:

```text
allure-results/
allure-report/
```

## Очистка тестовых данных

Проект создаёт временных пользователей для API и UI тестов.

После успешных тестов созданные пользователи автоматически добавляются в очередь очистки и удаляются в `global.teardown.js`.

Если тест упал, пользователь не удаляется автоматически. Это сделано специально, чтобы можно было разобрать состояние данных после падения.

Служебные файлы очистки хранятся в:

```text
.test-artifacts/
```

Эта папка добавлена в `.gitignore`.

## CI

В проекте есть базовый GitHub Actions workflow:

```text
.github/workflows/playwright.yml
```

Сейчас workflow:

- устанавливает зависимости;
- устанавливает браузеры Playwright;
- запускает тесты;
- сохраняет Playwright report как artifact.

## Что планируется донастроить

Для полного соответствия требованиям дипломного проекта осталось:

- добавить 5-й API functional test;
- настроить публикацию Allure Report с history в GitHub Pages;
- добавить отправку уведомлений в Telegram;
- подключить передачу результатов в Allure TestOps;
- добавить в README ссылки и скриншоты Allure Report / Allure TestOps после настройки инфраструктуры.

## Полезные команды

```bash
# все тесты
npm test

# API
npm run test:api

# API по тегам
npm run test:api:post
npm run test:api:get
npm run test:api:put
npm run test:api:delete

# Allure
npm run test:report
npm run allure:open
```
