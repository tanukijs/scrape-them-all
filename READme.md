# Installation
```sh
# Using NPM
npm install --save scrape-them-all

# Using Yarn
yarn add scraper-them-all
```

# Data model options
- `selector` _(String, Object)_ Can be a string expression, DOM Element, array of DOM elements, or cheerio object.
- `isListItem` _(Boolean)_ Indicates that the selector is the parent of a list. Default as false.
- `isTrimmed` _(Boolean)_ Trim whitespaces in the result. Default as true.
- `attribute` _(String)_ Return the value of the indicated attribute on the selected element.
- `accessor` _(String, Function)_ Cheerio access method name (like "`html`" for returning html code) or a custom function that take a Cheerio instance as first parameter.
- `transformer` _(Function)_ The first parameter is your current value for the selected item. Can return a `Promise`.
- `dataModel` _(Object)_ Contains the options stated above in case of a list.