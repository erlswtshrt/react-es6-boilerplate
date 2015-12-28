var gulp          = require('gulp');
var gutil         = require('gulp-util');
var gulpif        = require('gulp-if');
var streamify     = require('gulp-streamify');
var autoprefixer  = require('gulp-autoprefixer');
var cssmin        = require('gulp-cssmin');
var sass          = require('gulp-sass');
var plumber       = require('gulp-plumber');
var source        = require('vinyl-source-stream');
var babelify      = require('babelify');
var browserify    = require('browserify');
var watchify      = require('watchify');
var uglify        = require('gulp-uglify');

var production = process.env.NODE_ENV === 'production';

var dependencies = [
  'react',
  'react-dom',
  'react-router'
];

// bundle once
gulp.task('browserify', function() {
  return browserify('app/main.js')
    .external(dependencies)
    .transform(babelify, { presets: ['es2015', 'react'] })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'));
});

gulp.task('browserify-vendor', function() {
  return browserify()
    .require(dependencies)
    .bundle()
    .pipe(source('vendor.bundle.js'))
    .pipe(gulpif(production, streamify(uglify({ mangle: false }))))
    .pipe(gulp.dest('public/js'));
});

// watch and bundle on change
gulp.task('browserify-watch',  ['browserify-vendor'], function() {
  var bundler = watchify(browserify('app/main.js', watchify.args));
  bundler.external(dependencies);
  bundler.transform(babelify, { presets: ['es2015', 'react'] });
  bundler.on('update', rebundle);
  return rebundle();

  function rebundle() {
    var start = Date.now();
    return bundler.bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .on('end', function() {
        gutil.log(gutil.colors.green('Finished rebundling in', (Date.now() - start) + 'ms.'));
      })
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('public/js/'));
  }
});

// compile to css
gulp.task('styles', function() {
  return gulp.src('app/stylesheets/main.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulpif(production, cssmin()))
    .pipe(gulp.dest('public/css'));
});

// recompile on change
gulp.task('watch', function() {
  gulp.watch('app/stylesheets/**/*.scss', ['styles']);
});

gulp.task('default', ['browserify-watch','watch']);
gulp.task('build', ['styles', 'browserify']);