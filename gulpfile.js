'use strict';
const { src, dest, series, parallel, watch } = require('gulp');
const del = require('del');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const Fiber = require('fibers');
const optimize = require('gulp-requirejs-optimize');
const cache = require('gulp-cached');
const remember = require('gulp-remember');
const debug = require('gulp-debug');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');
const gulpif = require('gulp-if');
const useref = require('gulp-useref');
// const awspublish = require("gulp-awspublish");
// const lazypipe = require('lazypipe');
const uglify = require('gulp-uglify');
// gulp.spritesmith
// gulp-imagemin
// gulp-sourcemaps
const revColletor = require('./storage/plugin/gulp-rev-coll.js');

const paths = {
    src: 'src/',
    css: 'src/css/**/*.css',
    scss: 'src/css/**/*.scss',
    js: 'src/js/**/*.js',
    html: 'src/**/*.html',
    dist: 'storage/static/build/',
    static: 'storage/static/'
}


function clearnBuild(cb) {
    return del([
        './storage/static/build'
    ]);
}

function compileStatic() {
    return src(['storage/static/**/*', '!storage/static/build/**/*'], {nodir: true})
        .pipe(cache('_compileStatic'))
        .pipe(debug({title: 'compileStatic compilite:'}))
        .pipe(remember('_compileStatic'))
        .pipe(rev())
        .pipe(dest('storage/static/build/assets'))
        .pipe(rev.manifest({
            merge: true
        }))
        .pipe(dest('storage/static/build/assets'))
        .pipe(browserSync.stream());
}

function replaceLink() {
    return src([
            'storage/static/build/assets/**/*.json',
            'storage/static/build/**/*.html',
            'storage/static/build/**/*.css'
        ])
        .pipe(cache('_replaceLink'))
        .pipe(debug({title: 'replaceLink compilite:'}))
        .pipe(remember('_replaceLink'))
        .pipe(revColletor({
            replaceReved: true,
            dirReplacements: {
                'static/': './assets/'
            }
        }))
        // .pipe(gulpif('!*.json',
        //     revReplace({
        //     manifest: src('storage/static/build/assets/rev-manifest.json'),
        //     modifyUnreved: replaceJsIfMap,
        //     modifyReved: replaceJsIfMap
        // })))
        .pipe(dest(paths.dist))
        .pipe(browserSync.stream());
}

function replaceJsIfMap(filename) {
    if (filename.indexOf('.map') > -1) {
        return filename.replace('js/', '');
    }
    return filename;
}

function compileCss(cb) {
    return src(paths.css)
        .pipe(cache('_compileCss'))
        .pipe(debug({title: 'compileCss compilite:'}))
        .pipe(remember('_compileCss'))
        .pipe(dest('storage/static/build/css'))
        .pipe(browserSync.stream());
}

function compileSass(cb) {
    return src(paths.scss)
        .pipe(cache('_compileSass'))
        .pipe(debug({title: 'compileSass compilite:'}))
        .pipe(remember('_compileSass'))
        .pipe(sass({fiber: Fiber}).on('error', sass.logError))
        .pipe(dest('storage/static/build/css'))
        .pipe(browserSync.stream());
}

function compileJs(cb) {
    return src(paths.js)
        .pipe(cache('_compileJs'))
        .pipe(debug({title: 'compileJs compilite:'}))
        .pipe(remember('_compileJs'))
        // .pipe(optimize({
        //     baseUrl: 'storage/static/',
        //     preserveLicenseComments: false,
        //     optimize: 'none',
        // }))
        .pipe(dest('storage/static/build/js'))
        .pipe(browserSync.stream());
}

function compileHtml(cb) {
    return src(paths.html)
        .pipe(cache('_compileHtml'))
        .pipe(debug({title: 'compileHtml compilite:'}))
        .pipe(remember('_compileHtml'))
        .pipe(dest('storage/static/build/'))
        .pipe(browserSync.stream());
}


function merge() {
    return src('./src/**/*')
        .pipe(useref())
        .pipe(cache('_compile'))
        .pipe(debug({title: 'compile:'}))
        .pipe(remember('_compileJs'))
        // .pipe(gulpif('*.js', uglify()))
        // .pipe(gulpif('*.html', uglify()))
        // .pipe(gulpif('*.css', uglify()))
        .pipe(gulpif('*.sass', sass({fiber: Fiber}).on('error', sass.logError)))
        .pipe(dest('storage/static/build'))
        .pipe(browserSync.stream());
}

function relink() {
    return src([
            'storage/static/build/assets/**/*.json',
            'storage/static/build/**/*.html',
            'storage/static/build/**/*.css'
        ])
        .pipe(cache('_replaceLink'))
        .pipe(debug({title: 'replaceLink compilite:'}))
        .pipe(remember('_replaceLink'))
        // .pipe(revRewrite({
        //     manifest: src('storage/static/build/assets/rev-manifest.json'),
        //     modifyUnreved: testreplace,
        //     modifyReved: testreplace,
        //     dirReplacements: {
        //         'static/': './assets/'
        //     }
        // }))
        .pipe(revColletor({
            replaceReved: true,
            dirReplacements: {
                'static/': './assets/'
            }
        }))
        .pipe(dest(paths.dist));
}
function testreplace(filename, vinyl) {
    // console.log(filename, '>>>>>>>>>>>>>>>>>> .' + vinyl.path.replace(vinyl.cwd, ''));
    // .replace(vinyl.cwd, ''), 'opt.distFolder: ', opt.distFolder
  if (filename.includes('.map')) {
    return filename.replace('js/', '');
  }
  return filename;
}

const buildAll = series(parallel(
    compileSass,
    compileCss,
    compileJs,
    compileHtml,
    compileStatic,
    // compileFont,
    // compileMedia,
    // compileSdk
), relink);

function runServer(cb) {
    browserSync.init({
        server: {
            baseDir: "storage/static/build/"
        }
    });

    watch([
            paths.css,
            paths.js,
            paths.html,
            'storage/static/**/*',
            '!storage/static/build'
        ], {
            events: ['all']
        },
        buildAll
    );
    cb();
};

exports.build = series(
    clearnBuild,
    buildAll
);

exports.dev = series(buildAll, runServer);

exports.merge = merge;

exports.relink = relink;
