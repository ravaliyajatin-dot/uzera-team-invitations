module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'support/hooks.js',
      'step-definitions/common/*.js',
      'step-definitions/invitations/*.js'
    ],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1,
    timeout: 15000
  }
};
