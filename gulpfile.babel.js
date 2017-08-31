'use strict';

// 0.0 - Import
  import cp         from 'child_process';
  import fs         from 'fs';
  import gulp       from 'gulp';
  import gutil      from 'gulp-util';
  import path       from 'path';
  import plugins    from 'gulp-load-plugins';
  import prettify   from 'gulp-jsbeautifier';
  import rimraf     from 'rimraf';
  import yaml       from 'js-yaml';
  import yargs      from 'yargs';

// 0.1 - Load configuration & path variables
  const $ = plugins();                                                          // Load all Gulp plugins into one variable
  const PRODUCTION = !!(yargs.argv.production);                                 // Check for --production flag
  var { COMPATIBILITY, PORT, PATHS } = loadConfig();                            // Load settings from config.yml
  function loadConfig() {                                                       // Load Config
    let ymlFile = fs.readFileSync('config.yml', 'utf8');
    return yaml.load(ymlFile);
  }
  var THEME = {}; THEME.source = {} ; THEME.public = {}
    THEME.root  =     '.';//path.dirname( path.resolve() );                           // Set Theme root variable first
    THEME = {
      root      :     THEME.root,                                               // Full path of theme's root
      name      :     THEME.root.split( path.sep ).pop(),                       // Full name of theme's root folder
      source    :     path.join(THEME.root, '/source'),                         // Full path of theme's source folder
      static    :     path.join(THEME.root, '/static'),                         // Full path of theme's static folder
    };

// 0.2 - SCSS build task
  function sass() {
    return gulp.src( path.join(THEME.source, '/scss/app.scss') )                // SCSS import paths in `app.scss`
      .pipe($.sourcemaps.init())
      .pipe($.sass({                                                            // Build / concat scss
        includePaths: PATHS.sass
        })
        .on('error', $.sass.logError))
      .pipe($.autoprefixer({                                                    // Autoprefixer
        browsers: COMPATIBILITY
        }))
      .pipe($.if(PRODUCTION, $.cssnano()))                                      // In production, the CSS is compressed
      .pipe($.if(!PRODUCTION, $.sourcemaps.write()))                            // In production, the CSS is sourcemapped
      .pipe(gulp.dest( path.join(THEME.static, '/css') ));
  }

// 0.3 - JS build task
  function javascript() {
    return gulp.src( PATHS.javascript )                                         // JS import paths in `config.yml`
      .pipe($.sourcemaps.init())
      .pipe($.concat('app.js'))                                                 // Build / concat js
      .pipe($.if(PRODUCTION, $.uglify()                                         // In production, the file is minified
        .on('error', e => { console.log(e); })
        ))
      .pipe($.if(!PRODUCTION, $.sourcemaps.write()))                            // In production, the JS is sourcemapped
      .pipe(gulp.dest( path.join(THEME.static, '/js') ));
  }

  gulp.task('http-server', (code) => {
    // return cp.spawn('http-server', [], { stdio: 'inherit' })
    //   .on('error', (error) => gutil.log(gutil.colors.red(error.message)))
    //   .on('close', code);
  })

// 0.8 - Watch for changes for scss / js / lint
  function watch() {
    gulp.watch( path.join(THEME.source, '/scss/**/*.scss') ).on('all', sass);
    gulp.watch( path.join(THEME.source, '/js/**/*.js') ).on('all', javascript);
  }

// 1.0 - `Package.json` -> Gulp tasks
  gulp.task('build', gulp.series( gulp.parallel(sass, javascript) ));           // Build the 'static' folder
  gulp.task('css', gulp.series( sass ));                                        // Build the 'static' folder
  gulp.task('js', gulp.series( javascript ));                                   // Build the 'static' folder
  // gulp.task('public', gulp.series( 'build', clean, 'hugo-build', `lint` ));     // Build the site, run the server, and watch for file changes
  // gulp.task('server', gulp.series( 'build', clean, gulp.parallel('hugo-server', watch) ));  // Build the site, run the server, and watch for file changes
  gulp.task('server', gulp.series( 'build', watch));  // Build the site, run the server, and watch for file changes
  