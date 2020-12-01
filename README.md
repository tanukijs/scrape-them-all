<p align="center">
  <img src="https://i.imgur.com/rhrbozr.png" alt="Scrape Them All">
</p>
<p align="center">
  <img src="https://img.shields.io/github/license/tanukijs/scrape-them-all" alt="License">
  <img src="https://github.com/tanukijs/scrape-them-all/workflows/Build%20&%20tests/badge.svg" alt="Build & tests">
</p>

**[Scrape-Them-All](http://npmjs.com/package/scrape-them-all)** is a [Cheerio](https://cheerio.js.org) layer which improves your scraping experience. HTTP(S) requests are made with [Node-Fetch](https://github.com/node-fetch/node-fetch).

**This package is recent, if you have any suggestions or you notice that something is not working, feel free to open an issue or a pull-request, we will be happy to answer them as soon as possible**

---

<!-- TOC -->

## Table of content

- [Features](#features)
- [Installation](#installation)
- [Common Usage](#common-usage)
  - Scrape basic data
  - Scrape list
  - Transform data
  - Use a reserved keyword
- [Advanced Usage](#advanced-usage)
  - Use multiple nested objects
  - Scrape table
  - Get data modified by AJAX
  - Store redirections
- [API](#api)
- [License](#license)

## Installation

```sh
# Using NPM
npm install scrape-them-all
npm install fetch-cookie # optional

# Using Yarn
yarn add scrape-them-all
yarn add fetch-cookie # optional
```

`fetch-cookie` is only required if you plan to use the `cookieJar` option on requests.

**⚠ If you get a `too many redirects` error during the scrape, we recommend to install `fetch-cookie` and set the `cookieJar` option to true in your request.**

```js
// CommonJS
const scrapeTA = require('scrape-them-all')

// ES Module
import { scrapeTA } from 'scrape-them-all'
```

## Common Usage

<details>
  <summary>Scrape basic data</summary>

```js
// Code
const { response, data } = await scrapeTA(`http://localhost:${port}`, {
  title: 'h1.title',
  description: '.description'
}).then((data) => console.log(data))
  .catch((error) => console.error(error))
```

```js
// Output
{
  title: 'Title',
  description: 'Lorem ipsum',
  date: new Date('1988-01-01')
}
```

</details>

<details>
  <summary>Scrape list</summary>

:point_right: **Use `listModel` to define which selector to loop on.**

```js
// Code
const { response, data } = await scrapeTA(`http://localhost:${port}`, {
  features: {
    selector: '.features',
    listModel: {
      selector: 'li'
    }
  }
}).then((data) => console.log(data))
  .catch((error) => console.error(error))
```

```js
// Output
{
  features: ['1', '2', '3', '4', '5', '6']
}
```

</details>

<details>
  <summary>Transform data</summary>

:point_right: **Use `transform` to format asynchronously the scraped data.**

```js
// Code
const { response, data } = await scrapeTA(`http://localhost:${port}`, {
  features: {
    selector: '.features',
    listModel: {
      selector: 'li'
      transformer: (x) => parseInt(x, 10) // convert asynchronously the scraped data from string to number
    }
  }
}).then((data) => console.log(data))
  .catch((error) => console.error(error))
```

```js
// Output
{
  features: [1, 2, 3, 4, 5, 6]
}
```

</details>

<details>
  <summary>Use a reserved keyword</summary>

:point*right: \*\*`selector`, `trim`, `attribute`, `accessor`, `transformer`, `listModel` are reserved keywords, if you want to name your key like that, prefix it with an underscore (`*`)\*\*

**PS : you can use double underscore to prefix your key, for example I want to name my key `_attribute` so in my code i need to use `__attribute` with double underscore to bypass the reserved keyword.**

```js
// Code
const { response, data } = await scrapeTA(`http://localhost:${port}`, {
  title: 'h1.title',
  _attribute: {
    selector: 'img',
    attribute: 'src'
  }
}).then((data) => console.log(data))
  .catch((error) => console.error(error))
```

```js
// Output
{
  title: 'Title',
  attribute: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/ee/ee276885cdbec23bdb9780509210c3c24dc7070e_full.jpg'
}
```

</details>

## Advanced Usage

<details>
  <summary>Use multiple nested objects</summary>

```js
// Code
const { response, data } = await scrapeTA(`http://localhost:${port}`, {
  nested: {
    selector: '.nested',
    foo: {
      level1: {
        selector: '.level1',
        level2: {
          selector: 'span',
          accessor: (x) => x.eq(1).text()
        }
      },
      level1Text: {
        selector: 'span'
      },
      level2Text: {
        selector: '.level2'
      }
    }
  }
}).then((data) => console.log(data))
  .catch((error) => console.error(error))
```

```js
// Output
{
  nested: {
    foo: {
      level1: {
        level2: '2'
      },
      level1Text: 'Foo12',
      level2Text: '2'
    }
  }
}
```

</details>

<details>
  <summary>Scrape table</summary>

:point_right: **With `accessor` you can use any function of the [Cheerio API](https://cheerio.js.org/#api) to access and manipulate the scraped data.**

```js
// Code
const { response, data } = await scrapeTA(`http://localhost:${port}`, {
  addresses: {
    selector: 'table tbody tr',
    listModel: {
      address: '.address',
      city: {
        accessor: (x) => x.closest('table').find('thead .city').text()
      }
    }
  }
}).then((data) => console.log(data))
  .catch((error) => console.error(error))
```

```js
// Output
{
  addresses: [
    { address: 'one way street', city: 'Sydney' },
    { address: 'GT Road', city: 'Sydney' }
  ]
}
```

</details>

<details>
  <summary>Get data modified by AJAX</summary>

:point_right: **Just add parameters to the URL and headers to the request.**

```js
// Code
const { response, data } = await scrapeTA(
  {
    url:
      'https://www.dofus.com/en/mmorpg/encyclopedia/pets/11950-ankascraper?level=100&_pjax=.ak-item-details-container',
    headers: {
      'x-requested-with': 'XMLHttpRequest',
      'x-pjax': 'true',
      'x-pjax-container': '.ak-item-details-container'
    }
  },
  {
    effect: {
      selector: '.ak-container.ak-content-list.ak-displaymode-col .ak-title',
      accessor: (x) => x.eq(0).text()
    }
  }
).then((data) => console.log(data))
 .catch((error) => console.error(error))
```

```js
// Output
{
  effect: '120 Chance'
}
```

</details>

<details>
  <summary>Store redirections</summary>

:point_right: **Just set the `cookieJar` option to true to store the last redirected URL in cookie and bypass loop redirection from `/home` to `/login` page for example.**

```js
// Code
const { response, data } = await scrapeTA(
  { url: 'http://www.krosmoz.com/en/almanax/2020-01-01', cookieJar: true },
  {
    month: {
      selector: '#almanax_day .day-text'
    }
  }
)
```

```js
// Output
{
  month: 'Javian'
}
```

</details>

## API

#### `scrapeTA(query, schema)`

Params:

- **query** `String` or `Object`: The page url or the page url and node-fetch options.
- **schema** `Object`: the list of elements to scrape and the corresponding HTML tags.

Returns:

- `Promise<{ response, data }>`
  - **response** `Object`: response from node-fetch ([documentation](https://github.com/node-fetch/node-fetch#class-response))
  - **data** `Object`: scraped data

Perform an HTTP(S) request.

URL should be absolute, such as https://example.com. A path-relative URL (/file/under/root) or protocol-relative URL (//can-be-http-or-https.com) will result in a rejected Promise.

#### Query options

:warning: **Go to [node-fetch](https://github.com/node-fetch/node-fetch#options) and [tough-cookie](https://github.com/salesforce/tough-cookie) documentation for more informations.**

```js
{
  // These properties are part of the Fetch Standard
  method: 'GET',
  headers: {},                  // Request headers. format is the identical to that accepted by the Headers constructor (see below)
  body: null,                   // Request body. can be null, a string, a Buffer, a Blob, or a Node.js Readable stream
  redirect: 'follow',           // Set to `manual` to extract redirect headers, `error` to reject redirect
  signal: null,                 // Pass an instance of AbortSignal to optionally abort requests

  // The following properties are node-fetch extensions
  follow: 20,                   // maximum redirect count. 0 to not follow redirect
  compress: true,               // support gzip/deflate content encoding. false to disable
  size: 0,                      // maximum response body size in bytes. 0 to disable
  agent: null,                  // http(s).Agent instance or function that returns an instance (see below)
  highWaterMark: 16384,         // The maximum number of bytes to store in the internal buffer before ceasing to read from the underlying resource.
  insecureHTTPParser: false	// Use an insecure HTTP parser that accepts invalid HTTP headers when `true`.

  // The following properties are scrape-them-all extensions
  cookieJar: false              // Add cookies support when `true` (https://github.com/salesforce/tough-cookie)
}
```

#### Schema options

| Option          | Type                   | Description                                                                                                                            |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **selector**    | `String` or `Object`   | Can be a string expression, DOM Element, array of DOM elements, or cheerio object.                                                     |
| **trim**        | `Boolean`              | Trim whitespaces in the result. **Default as `true`**.                                                                                 |
| **attribute**   | `String`               | Return the value of the indicated attribute on the selected element.                                                                   |
| **accessor**    | `String` or `Function` | Cheerio access method name (like `html` for returning html code) or a custom function that take a Cheerio instance as first parameter. |
| **transformer** | `Function`             | The first parameter is your current value for the selected item. Can return a `Promise`.                                               |
| **listModel**   | `Object`               | Contains the options stated above in case of a list.                                                                                   |

---

# 💪 Contributions

TODO

---

# 📜 License

[MIT](https://github.com/tanukijs/scrape-them-all/blob/typescript/LICENSE) © [Tanuki](https://github.com/tanukijs), [Aperrix](https://github.com/Aperrix).
