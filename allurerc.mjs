export default {
  name: 'o2cloud calc dev',
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  plugins: {
    awesome: {
      options: {
        reportName: 'o2cloud calc dev',
        reportLanguage: 'en',
        singleFile: false,
        open: false,
      },
    },
  },
};
