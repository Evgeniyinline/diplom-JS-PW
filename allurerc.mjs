import { env } from 'node:process';

const testOpsEnabled = env.ALLURE_ENDPOINT && env.ALLURE_TOKEN && env.ALLURE_PROJECT_ID;

export default {
  name: 'Diplom Autotests',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'Diplom Autotests',
        reportLanguage: 'en',
        singleFile: false,
        open: false,
      },
    },
    ...(testOpsEnabled
      ? {
          testops: {
            import: '@allurereport/plugin-testops',
            options: {
              endpoint: env.ALLURE_ENDPOINT,
              accessToken: env.ALLURE_TOKEN,
              projectId: env.ALLURE_PROJECT_ID,
              launchName: env.ALLURE_LAUNCH_NAME || 'Diplom Playwright JS',
              launchTags: ['github-actions', 'playwright', 'javascript', 'diplom'],
              autocloseLaunch: true,
            },
          },
        }
      : {}),
  },
};
