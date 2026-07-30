---
alwaysApply: true
scene: git_message
---

Generate exactly one Git commit message based only on the provided Git diff.

Use Conventional Commits format:

<type>(<scope>): <subject>

Allowed types:

// новая функциональность приложения или тестового фреймворка
- feat — add new application or testing functionality

// исправление ошибки или неправильного поведения
- fix — fix a bug or incorrect behavior

// добавление или изменение автотестов
- test — add or update automated tests

// изменение структуры кода без изменения его поведения
- refactor — restructure code without changing behavior

// добавление или обновление документации
- docs — update documentation

// изменение настроек CI/CD
- ci — update CI/CD configuration

// обновление зависимостей, конфигурации или инструментов
- chore — update dependencies, configuration, or tooling

Rules:

1. Write the commit message in English.
2. Use lowercase for type and scope.
3. Use an imperative verb in the subject: add, fix, update, remove, extract.
4. Keep the subject at 72 characters or fewer.
5. Do not end the subject with a period.
6. Choose a short scope that describes the affected area.
7. Describe the purpose of the change, not the names of modified files.
8. Do not use vague subjects such as:
   - update code
   - fix tests
   - changes
   - minor fixes
9. Do not invent changes, task numbers, or reasons that are not visible in the diff.
10. Use `test` when the main change adds or modifies automated tests.
11. Use `fix` only when the change corrects incorrect behavior.
12. Add a body only when the subject cannot adequately explain the change.
13. Return only the commit message without Markdown, explanations, or alternatives.
