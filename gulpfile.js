// modules
const fs      = require('fs')
const bsync   = require('browser-sync').create()
const webpack = require('webpack-stream')
const indexer = require('component-indexer')

// gulp
const { src, dest, series, parallel, watch } = require('gulp')

// gulp plugins
const pug                 = require('gulp-pug')
const sass                = require('gulp-sass')(require('sass'))
const data                = require('gulp-data')
const concat              = require('gulp-concat')
const rename              = require('gulp-rename')
const replace             = require('gulp-replace')
const xml2json            = require('gulp-xml2json')
const cleanCSS            = require('gulp-clean-css')
const sourcemaps          = require('gulp-sourcemaps')
const urlBuilder          = require('gulp-url-builder')
const jsonFormat          = require('gulp-json-format')
const jsonMinify          = require('gulp-json-minify')
const autoprefixer        = require('gulp-autoprefixer')
const htmlbeautify        = require('gulp-html-beautify')
const sassExtendShorthand = require('gulp-sass-extend-shorthand')

// helpers
const paths = (base, folders) => folders.map(folder => base + '/' + folder)

// variables
const destination = 'docs'
const jsonIndex = paths('src/json', ['mixins'])
const pugIndex = paths('src/pug', ['mixins'])
const locals = {
  root: 'https://example.com/',
  lastmod: new Date().toISOString().slice(0, 10)
}

// json
function jsonIndexer(cb) {
  jsonIndex.forEach(path => indexer(path, 'pug'))
  cb()
}
function jsonCompile() {
  return src([
    'src/json/views/**/*.pug'
  ]).pipe( pug({ locals, doctype: 'xml' }) )
    .pipe( rename((path) => { path.extname = '.xml' }) )
    .pipe( xml2json({
      explicitRoot: false,
      explicitArray: false,
      ignoreAttrs: true
    }))
    .pipe( jsonFormat(2) )
    .pipe( replace(/(^\s*")at-/gm, '$1@') )
    .pipe( jsonMinify() )
    .pipe( replace(/^{"entity":/g, '') )
    .pipe( replace(/}$/g, '') )
    .pipe( rename((path) => { path.basename = path.basename.split('.')[0], path.extname = '.min.json' }) )
    .pipe( dest('src/json/output') )
    .pipe( jsonFormat(2) )
    .pipe( rename((path) => { path.basename = path.basename.split('.')[0] }) )
    .pipe( dest('src/json/output') )
}
function jsonWatch(cb) {
  watch(['src/json/**/*.pug'], series(jsonIndexer, jsonCompile))
  cb()
}

// pug
function pugIndexer(cb) {
  pugIndex.forEach(path => indexer(path, 'pug'))
  cb()
}
function pugCompile() {
  return src([
    'src/pug/views/**/*.pug'
  ]).pipe( pug({ locals }) )
    .pipe( htmlbeautify({ indent_size: 2, content_unformatted: ['script'] }) )
    .pipe( urlBuilder() )
    .pipe( dest(destination) )
    .pipe( bsync.reload({ stream: true }) )
}
function pugWatch(cb) {
  watch(['src/pug/**/*.pug', '!**/_index.*'], series(pugIndexer, pugCompile))
  cb()
}

// sass
function sassShorthand() {
  return src([
    'src/scss/**/%*.+(sass|scss|css)'
  ]).pipe( sassExtendShorthand() )
    .pipe( rename(function(path) {
      path.basename = path.basename.replace('%','_')
    }) )
    .pipe( dest(file => file.base) )
}
function sassCompile() {
  return src([
    'src/scss/*.+(sass|scss|css)'
  ]).pipe( sass() )
    .pipe( autoprefixer() )
    .pipe( dest(`${destination}/css`) )
    .pipe( cleanCSS() )
    .pipe( rename((path) => { path.extname = '.min.css' }) )
    .pipe( dest(`${destination}/css`) )
    .pipe( bsync.reload({ stream: true }) )
}
function sassWatch(cb) {
  watch([
    'src/scss/**/%*.*'
  ], series(sassShorthand))
  watch([
    'src/scss/**/*.+(sass|scss)',
    '!src/scss/**/%*.*',
    '!src/scss/**/_index.*'
  ], series(sassCompile))
  cb()
}

// javascript
function jsBundle() {
  return src('src/js/app.js')
    .pipe( webpack({ mode: 'development' }) )
    .pipe( rename({ basename: 'app' }) )
    .pipe( dest(`${destination}/js`) )
    .pipe( bsync.reload({ stream: true }) )
}
function jsWatch(cb) {
  watch('src/js/**/*.js', jsBundle)
  cb()
}

// browsersync
function sync() {
  bsync.init({
    server: {
      baseDir: `./${destination}`
    }
  })
}

// meta
function sitemapCompile() {
  return src([
    'src/meta/sitemap.pug'
  ]).pipe( pug({ locals, pretty: true }) )
    .pipe( rename((path) => { path.extname = '.xml' }) )
    .pipe( dest(destination) )
}
function robotsCompile() {
  return src([
    'src/meta/robots.txt'
  ]).pipe( replace(/https:\/\/root\//gm, locals.root) )
    .pipe( dest(destination) )
}
function faviconCompile() {
  return src([
    'src/meta/favicon.pug'
  ]).pipe( pug({ doctype: 'xml', pretty: true }) )
    .pipe( rename((path) => { path.extname = '.svg' }) )
    .pipe( dest(destination) )
}
function metaWatch(cb) {
  watch('src/meta/*.*', series(sitemapCompile, robotsCompile, faviconCompile))
  cb()
}

// exports
exports.meta    = series(sitemapCompile, robotsCompile, faviconCompile)
exports.json    = series(jsonIndexer, jsonCompile)
exports.pug     = series(pugIndexer, pugCompile)
exports.sass    = series(sassShorthand, sassCompile)
exports.js      = series(jsBundle)
exports.build   = series(exports.meta, exports.json, exports.pug, exports.sass)
exports.watch   = series(metaWatch, jsonWatch, pugWatch, sassWatch, jsWatch)
exports.default = series(exports.build, exports.watch, sync)
