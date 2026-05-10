/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'fsd-no-shared-depends-on-upper',
      comment: 'FSD: Shared layer should not depend on anything above it',
      severity: 'error',
      from: { path: '(^|/)shared/' },
      to: { path: '(^|/)(entities|features|widgets|pages|app)/' }
    },
    {
      name: 'fsd-no-entities-depends-on-upper',
      comment: 'FSD: Entities layer should not depend on features, widgets, pages, app',
      severity: 'error',
      from: { path: '(^|/)entities/' },
      to: { path: '(^|/)(features|widgets|pages|app)/' }
    },
    {
      name: 'fsd-no-features-depends-on-upper',
      comment: 'FSD: Features layer should not depend on widgets, pages, app',
      severity: 'error',
      from: { path: '(^|/)features/' },
      to: { path: '(^|/)(widgets|pages|app)/' }
    },
    {
      name: 'fsd-no-widgets-depends-on-upper',
      comment: 'FSD: Widgets layer should not depend on pages, app',
      severity: 'error',
      from: { path: '(^|/)widgets/' },
      to: { path: '(^|/)(pages|app)/' }
    },
    {
      name: 'fsd-no-pages-depends-on-upper',
      comment: 'FSD: Pages layer should not depend on app',
      severity: 'error',
      from: { path: '(^|/)pages/' },
      to: { path: '(^|/)(app)/' }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    includeOnly: '^src|^packages|^apps'
  }
};
