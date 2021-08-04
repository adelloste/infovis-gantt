// generated on 2021-07-29 using generator-webapp 4.0.0-8
const { src, dest, watch, series, parallel, lastRun } = require('gulp');
const ghPages                                         = require('gulp-gh-pages');
const gulpLoadPlugins                                 = require('gulp-load-plugins');
const browserSync                                     = require('browser-sync');
const del                                             = require('del');
const autoprefixer                                    = require('autoprefixer');
const cssnano                                         = require('cssnano');
const { argv }                                        = require('yargs');
const replace                                         = require('gulp-replace');
const log                                             = require('fancy-log');

const $      = gulpLoadPlugins();
const server = browserSync.create();

const port = argv.port || 9000;

const isDeploy = process.env.NODE_ENV === 'deploy';
const isProd   = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'deploy';
const isTest   = process.env.NODE_ENV === 'test';
const isDev    = !isProd && !isTest && !isDeploy;

const baseHref = '/infovis-gantt/';

function styles() {
  return src('app/styles/*.scss', {
    sourcemaps: !isProd,
  })
    .pipe($.plumber())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      autoprefixer()
    ]))
    .pipe(dest('.tmp/styles', {
      sourcemaps: !isProd,
    }))
    .pipe(server.reload({stream: true}));
};

function scripts() {
  return src('app/scripts/**/*.js', {
    sourcemaps: !isProd,
  })
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(dest('.tmp/scripts', {
      sourcemaps: !isProd ? '.' : false,
    }))
    .pipe(server.reload({stream: true}));
};

const lintBase = (files, options) => {
  return src(files)
    .pipe($.eslint(options))
    .pipe(server.reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!server.active, $.eslint.failAfterError()));
}

function lint() {
  return lintBase('app/scripts/**/*.js', { fix: true })
    .pipe(dest('app/scripts'));
};

function lintTest() {
  return lintBase('test/spec/**/*.js');
};

function html() {
  return src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if(/\.js$/, $.terser({compress: {drop_console: true}})))
    .pipe($.if(/\.css$/, $.postcss([cssnano({safe: true, autoprefixer: false})])))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: {compress: {drop_console: true}},
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(dest('dist'));
}

function images() {
  return src('app/assets/images/**/*', { since: lastRun(images) })
    .pipe($.imagemin())
    .pipe(dest('dist/assets/images'));
};

function fonts() {
  return src('app/assets/fonts/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe($.if(!isProd, dest('.tmp/assets/fonts'), dest('dist/assets/fonts')));
};

function stubs() {
  return src('app/assets/stubs/**/*')
  .pipe($.if(!isProd, dest('.tmp/assets/stubs'), dest('dist/assets/stubs')));
};

function extras() {
  return src([
    'app/*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(dest('dist'));
};

function clean() {
  return del(['.tmp', 'dist'])
}

function measureSize() {
  return src('dist/**/*')
    .pipe($.size({title: 'build', gzip: true}));
}

const build = series(
  clean,
  parallel(
    lint,
    series(parallel(styles, scripts), html),
    images,
    fonts,
    stubs,
    extras
  ),
  measureSize
);

function injectBaseHref() {
  return src('dist/index.html')
    .pipe(replace('<base href="/">', function handleReplace(match) {
      return '<base href="' + baseHref + '">'
    }))
    .pipe(dest('dist/'));
}

function deploy() {
  return src('dist/**/*')
    .pipe(ghPages());
}

const release = series(
  build,
  injectBaseHref,
  deploy
);

function startAppServer() {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  });

  watch([
    'app/*.html',
    'app/assets/images/**/*',
    '.tmp/assets/fonts/**/*',
    '.tmp/assets/stubs/**/*',
  ]).on('change', server.reload);

  watch('app/styles/**/*.scss', styles);
  watch('app/scripts/**/*.js', scripts);
  watch('app/assets/fonts/**/*', fonts);
  watch('app/assets/stubs/**/*', stubs);
}

function startTestServer() {
  server.init({
    notify: false,
    port,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/node_modules': 'node_modules'
      }
    }
  });

  watch('test/index.html').on('change', server.reload);
  watch('app/scripts/**/*.js', scripts);
  watch('test/spec/**/*.js', lintTest);
}

function startDistServer() {
  server.init({
    notify: false,
    port,
    server: {
      baseDir: 'dist',
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  });
}

let serve;
if (isDev) {
  serve = series(clean, parallel(styles, scripts, fonts, stubs), startAppServer);
} else if (isTest) {
  serve = series(clean, scripts, startTestServer);
} else if (isProd) {
  serve = series(build, startDistServer);
}

exports.serve   = serve;
exports.build   = build;
exports.default = build;
exports.release = release;