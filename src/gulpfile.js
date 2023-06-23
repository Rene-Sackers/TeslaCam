var rimraf = require("gulp-rimraf");
var browserSync = require('browser-sync').create();
var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var plumber = require("gulp-plumber");

var browserify = require("browserify");
var tsify = require("tsify");

var sass = require("gulp-sass")(require("sass"));
var cleanCss = require("gulp-clean-css");
var autoprefixer = require("gulp-autoprefixer");
var rename = require("gulp-rename");
var source = require("vinyl-source-stream");

var paths = {
	typescript: {
		src: "ts/**/*.ts"
	},
	browserify: {
		dest: "js/"
	},
	scss: {
		base: "scss/",
		src: "scss/**/*.scss"
	},
	css: {
		minifySrc: ["css/**/*.css", "!css/**/*.min.scss"],
		src: "css/**/*.css",
		dest: "css/"
	}
}

function browserifyScripts() {
	return browserify({
		basedir: ".",
		debug: true,
		entries: ["ts/main.ts"],
		cache: {},
		packageCache: {},
	  })
		.plugin(tsify)
		.bundle()
		.on('error', function(err){
			console.log(err.message);
		})
		.pipe(source("bundle.js"))
		.pipe(gulp.dest(paths.browserify.dest));
}

function cleanCssTask() {
	return gulp.src(paths.css.src, { allowEmpty: true, read: false })
		.pipe(rimraf({force: true}));
}

function buildScss() {
	return gulp.src(paths.scss.src, { base: paths.scss.base })
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.css.dest));
}

function minifyStyles() {
	return gulp.src(paths.css.minifySrc)
		.pipe(cleanCss())
		.pipe(rename({ extname: ".min.css" }))
		.pipe(gulp.dest(paths.css.dest));
}

var buildStyles = gulp.series(cleanCssTask, buildScss, minifyStyles);

function watch() {
	gulp.watch(paths.typescript.src, browserifyScripts);
	gulp.watch(paths.scss.src, buildStyles);
}

function serve() {
	browserSync.init({
		server: "./"
	});

	gulp.watch(paths.typescript.src, gulp.series(browserifyScripts, (cb) => { browserSync.reload(); cb(); }))
	gulp.watch(paths.scss.src, gulp.series(buildStyles, (cb) => { browserSync.reload(); cb(); }))
	gulp.watch(["./**/*.html"]).on("change", browserSync.reload);
}

exports.default = gulp.parallel(browserifyScripts, buildStyles);
exports.scripts = browserifyScripts;
exports.styles = buildStyles;
exports.watch = watch;
exports.serve = serve;