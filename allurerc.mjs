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
  },
};
