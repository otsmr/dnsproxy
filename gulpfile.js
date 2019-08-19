
const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const uglify = require("gulp-uglify-es").default;
const babel = require('gulp-babel');
const browserify = require('gulp-browserify');
const prefix = require('gulp-autoprefixer');
const ejs = require("gulp-ejs")
const htmlmin = require('gulp-htmlmin');
const size = require('gulp-size');
const plumber = require('gulp-plumber');

const public = "./public/";
const dist = "./assets/";

gulp.task('ejs', () => {
    gulp.src(dist + 'ejs/*.ejs')
    .pipe(ejs({
        data: ""
    }))
    .pipe(rename({ 
        extname: '.html'
    }))
    .pipe(htmlmin({ 
        collapseWhitespace: true
    }))
    .pipe(gulp.dest(public))
});

gulp.task('sass', () => {

    gulp.src(dist + 'sass/*.sass')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass())
        .pipe(size({ gzip: true, showFiles: true }))
        .pipe(prefix())
        .pipe(rename({ basename: 'style' }))
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(public + 'css'))

});

gulp.task('js', () => {

    gulp.src(dist + 'js/*.js')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(concat('main.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(browserify({
            insertGlobals: true
        }))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(public + 'js'))

});

gulp.task('copy', () => {

    gulp.src(dist + 'fonts/**/*')
        .pipe(gulp.dest(public + 'fonts'));
    gulp.src(dist + 'js/lib/**/*')
        .pipe(gulp.dest(public + 'js/lib'));
    gulp.src(dist + 'img/**/*')
        .pipe(gulp.dest(public + 'img'));

});

gulp.task('watch', () => {

    gulp.watch(dist + 'sass/**/*.sass', ['sass']);
    gulp.watch(dist + 'ejs/**/*.ejs', ['ejs']);
    gulp.watch(dist + 'js/**/*.js', ['js']);
    gulp.watch(dist + 'fonts/**/*', ['copy']);
    gulp.watch(dist + 'img/**/*', ['copy']);
    gulp.watch(dist + 'js/lib/**/*', ['copy']);

});

gulp.task('default', [
    'js',
    'copy',
    'sass',
    'ejs',
    'watch'
]);