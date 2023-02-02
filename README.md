# ![Hyperbeam](https://user-images.githubusercontent.com/9656851/216218004-39e50c3f-2d75-41c7-90ab-149cf913e6a5.svg)

**Tachyon Beam** is a static site generator built around the philosophy that:

- a straightforward utility class library can be very helpful
- utility classes should make writing media queries unnecessary
- utility classes don't belong in HTML
- only human-readable, semantic class names belong in HTML
- javascript shouldn't be necessary to exclude unused utility classes from compilation

It uses [Pug](https://pugjs.org/), [Sass](https://sass-lang.com/) (with a syntactic-sugar shorthand), and a custom build of the [Tachyons CSS](https://tachyons.io/) utility class library with configurable breakpoints and class suffixes.

It also includes methods for efficiently writing metadata content such as build processes for using Pug to write:

- [JSON-LD](https://json-ld.org/) structured data
- a sitemap.xml with automatically updated last modified dates
- SVG favicons

**Hyperbeam** is the leanest Tachyon Beam rig. It uses all of the default Tachyons CSS values and does not include variables for modifying them. Additionally, it excludes the skins, border color, and debug modules from Tachyons CSS.

## Table of Contents

1. [Setup](#setup)
1. [Sass](#sass)
    - [Extending Placeholder Utilities](#extending-placeholder-utilities)
    - [Shorthand for `@extend`](#shorthand-for-extend)
    - [Configuring Breakpoints](#configuring-breakpoints)
    - [Adding Custom Utility Classes](#adding-custom-utility-classes)
1. [Pug](#pug)
    - [Local Variables and Site URL](#local-variables-and-site-url)
    - [Automatic Inclusion of Mixins](#automatic-inclusion-of-mixins)
    - [Automatic Compilation into Directories](#automatic-compilation-into-directories)
    - [Unique `<head>` Content](#unique-head-content)
1. [JavaScript](#javascript)
1. [JSON-LD Structured Data](#json-ld-structured-data)
    - [File Setup](#file-setup)
    - [Mixins](#mixins)
    - [Syntax](#syntax)
    - [Locals](#locals)
1. [Favicon](#favicon)
1. [Sitemap](#sitemap)
1. [Robots.txt](#robotstxt)

## Setup

1. If you haven't already, use nvm to install `node` and `npm`
2. If you haven't already, globally install the gulp command line tools: `npm install --global gulp-cli`
3. Clone this repo
4. In the project folder, install the node package dependencies: `npm install`
5. In the project folder, run `gulp` to run all build processes, start browsersync, and watch for changes

## Sass

Hyperbeam includes a lean build of the Tachyons CSS utility class library that has been rewritten to use [Sass placeholder selectors](https://sass-lang.com/documentation/style-rules/placeholder-selectors).

This lean build excludes the skins, border color, and debug modules.

### Extending Placeholder Utilities

Using placeholder selectors means that the classes won't be output in the compiled CSS unless they're extended from within a ruleset declared elsewhere. This is the preferred method of writing Sass in projects built from Tachyon Beam rigs like Hyperbeam:

- use semantic, human-readable selectors
- avoid writing property and value declarations
- avoid writing media queries
- instead extend utility classes

```scss
// don't
.foobar {
  padding: 0.5rem;
  @media (min-width: 30em) {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
  @media (min-width: 60em) {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
}

// do
.my-semantic-class {
  @extend %pa2;
  @extend %pv3-ns;
  @extend %pv4-l;
}
```

### Shorthand for `@extend`

Writing a bunch of extend at-rules is tedious. Tachyon Beam builds support a [shorthand for writing extends](https://www.npmjs.com/package/gulp-sass-extend-shorthand) in Sass.

```scss
// this
.my-semantic-class {
  @extend %pa2;
  @extend %pv3-ns;
  @extend %pv4-l;
}

// can be shortened to this
.my-semantic-class {
  %pa2;
  %pv3-ns;
  %pv4-l;
}

// or even this
.my-semantic-class {
  %pa2, %pv3-ns, %pv4-l;
}
```

Tachyon Beam's Gulp tasks require the following:

- all files that use the shorthand have file names prefixed with `%`
- all files in `scss/partials` are written using the shorthand

The task for compiling shorthand files into regular Sass files creates the regular Sass files into the same folder. The `%` prefix in the file name is changed to a `_`.

- `scss/partials/%myfile.scss` becomes `scss/partials/_myfile.scss`

This process happens before Sass runs. When importing a shorthand file into another Sass file, use the underscore-prefixed file that has been compiled into regular Sass syntax.

### Configuring Breakpoints

The breakpoints used for the utility classes can be changed by altering the values of the `$breakpoints` map in the `scss/styles.scss` file. The properties are the suffixes that will be appended to the utility class selectors at each breakpoint, and the numerical value is the min-width (in `px`) used in each breakpoint's media query.

The `suffixer` mixin outputs a non-suffixed set of the utility classes first, then proceeds through the breakpoints in the `$breakpoints` map, outputting another set of the utility classes within a single media query sequentially for each breakpoint.

Be sure to configure the breakpoint widths from smallest to largest in the `$breakpoints` map and take a mobile-first approach to styling, as the larger breakpoints will be lower in the cascade.

### Adding Custom Utility Classes

Custom utility classes can be added to augment the Tachyon CSS classes. Declare these in the `scss/utilities/_custom.scss` file. Use placeholder selectors. In order for the appropriate suffix to be added to the classes at each breakpoint, append `#{$s}` to the selectors.

```scss
%lh-compressed#{$s} {
  line-height: 0.92;
}
```

## Pug

### Local Variables and Site URL

In the `gulpfile.js` file, the `locals` object is passed to all Pug processes and its properties are available as local variables.

Update the `root` local variable to the site's URL. This is used by many different Gulp tasks, and cuts down on the number of places it needs to be updated.

### Automatic Inclusion of Mixins

All mixin files in the `pug/mixins` folder will be automatically indexed and `include`-referenced in the `pug/mixins/_index.pug` file when Gulp is running. This file is is then `include`-referenced in the `pug/templates/_root.pug` template file, making all mixins available within all files that extend the root. The [`component-indexer`](https://www.npmjs.com/package/component-indexer) node package provides this functionality.

### Automatic Compilation into Directories

Tachyon Beam uses the [`gulp-url-builder`](https://www.npmjs.com/package/gulp-url-builder) node package to compile Pug views into index HTML files within appropriate directories based on a file naming convention.

Use underscores to denote directory paths. Use hyphens to separate words.

| pug view file | compiles to | accessible at |
| --- | --- | --- |
| `index.pug` | `/docs/index.html` | `example.com/` |
| `about.pug` | `/docs/about/index.html` | `example.com/about/` |
| `about_our-team.pug` | `/docs/about/our-team/index.html` | `example.com/about/our-team/` |

### Unique `<head>` Content

From a view file, prepend variables to the `head` block of the root template in order to set page-specific metadata. The default variables are:

| variable name | function |
| --- | --- |
| `path` | is combined with the `root` local variable to set the URI of the canonical link element |
| `title` | sets the content of the `<title>` element and the `og:title` meta element |
| `description` | sets the `description` and `og:description` meta elements |
| `image` | path to the OpenGraph image |
| `alt` | alt text for the OpenGraph image |
| `card` | string specifying the type of card Twitter should display |

## JavaScript

JavaScript is bundled using [webpack](https://webpack.js.org/).

## JSON-LD Structured Data

Tachyon Beam has a process for converting Pug into JSON-LD for things like [Schema.org](https://schema.org/) structured data.

### File Setup

These files should be written with the compound extension `.json.pug` in the `json/views` folder. They'll be processed into minified and unminified JSON files in a `json/output` folder. They aren't output into the `docs` folder because they're meant to be `include`-referenced from within Pug files. This process runs before the main Pug tasks, so the compiled files will be available for inclusion.

### Mixins

Like the mixins in the `pug/mixins` folder, mixin files in the `json/mixins` folder will be automatically indexed and `include`-referenced in the `json/mixins/_index.pug` file when Gulp is running. This file is is then `include`-referenced in the `json/templates/_root.pug` template file, making all mixins available within all files that extend the root.

### Syntax

The Pug is first compiled into XML before being transpiled into JSON.

- **Properties and values:** Pug elements become properties and Pug text nodes become values

  ```pug
  name Jean-Luc Picard
  rank Captain
  ```

  ```json
  {
    "name": "Jean-Luc Picard",
    "rank": "Captain"
  }
  ```

- **Arrays:** Repeat elements to roll their contents up into an array that's the value of the property matching the name of the repeated element

  ```pug
  name Jean-Luc Picard
  rank Captain
  postings USS Reliant
  postings USS Stargazer
  postings USS Enterprise-D
  postings USS Enterprise-E
  ```

  ```json
  {
    "name": "Jean-Luc Picard",
    "rank": "Captain",
    "postings": [
      "USS Reliant",
      "USS Stargazer",
      "USS Enterprise-D",
      "USS Enterprise-E"
    ]
  }
  ```

- **Nested objects:** Nest Pug elements to create nested objects

  ```pug
  identifier NCC-1701-D
  knownAs USS Enterprise
  milestones
    launched 2363-10-04
    destroyed 2371-02-03
  ```

  ```json
  {
    "identifier": "NCC-1701-D",
    "knownAs": "USS Enterprise",
    "milestones": {
      "launched": "2363-10-04",
      "destroyed": "2371-02-03"
    }
  }
  ```

- **Properties with asperands:** Use `at-` to create property names that start with `@`

  ```pug
  at-context http://www.schema.org
  at-type Place
  name Vulcan
  ```

  ```json
  {
    "@context": "http://www.schema.org",
    "@type": "Place",
    "name": "Vulcan"
  }
  ```

### Locals

The `locals` object in the `gulpfile.js` is available from with these Pug files too.

## Favicon

Use Pug syntax to write an SVG file for the favicon: `src/meta/favicon.pug` will compile to `docs/favicon.svg`.

## Sitemap

Use Pug syntax to write XML for the sitemap file. `src/meta/sitemap.pug` will compile to `docs/sitemap.xml`.

The `locals` object in the `gulpfile.js` is available from with these Pug files too. Whenever the default `gulp` task is run, Hyperbeam passes the current date to pug as the `lastmod` local variable. This can be used within the sitemap to ensure `<lastmod>` elements are always up-to-date.

## robots.txt

The robots file at `src/meta/robots.txt` will be processed and output at `docs/robots.txt`. Hyperbeam will automatically update all instances of `https://root` to use the site url specified in the `locals` object within the `gulpfile.js`.
