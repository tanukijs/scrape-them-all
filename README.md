![Scrape Them All](https://i.imgur.com/rhrbozr.png)

![License](https://img.shields.io/github/license/tanukijs/scrape-them-all) ![Build & tests](https://github.com/tanukijs/scrape-them-all/workflows/Build%20&%20tests/badge.svg)

**[Scrape-Them-All]()** is a [Cheerio](https://cheerio.js.org) layer which improves your scraping experience.

**This package is recent, if you have any suggestions or you notice that something is not working, feel free to open an issue or a pull-request, we will be happy to answer them as soon as possible**

---

# 📦 Installation

```sh
# Using NPM
npm install --save scrape-them-all
npm install --save fetch-cookie #optional

# Using Yarn
yarn add scrape-them-all
yarn add fetch-cookie #optional
```


`fetch-cookie` is only required if you plan to use the `cookieJar` option on requests.

**⚠ If you get a ``too many redirects`` error when you scrape, we recommend to install ``fetch-cookie`` and use the option ``cookieJar: true`` in your request.**

Exemple:
```js
scrapeTA({url: 'https://google.com', cookieJar: true})
```
---

# 📚 Documentation

### ``scrapeTA(query, schema)``

Params:

- **String|Object** ``url``: The page url or the page url & request options
- **Object** ``schema``: the list of elements to scrape and the corresponding HTML tags

Returns:

- **Object** ``Promise<data>``: A promise object resolving with data in JSON format

## Schema options

| Option          | Type                   | Description                                                                                                                              |
| --------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **selector**    | `String` or `Object`   | Can be a string expression, DOM Element, array of DOM elements, or cheerio object.                                                       |  |
| **isTrimmed**   | `Boolean`              | Trim whitespaces in the result. Default as true.                                                                                         |
| **attribute**   | `String`               | Return the value of the indicated attribute on the selected element.                                                                     |
| **accessor**    | `String` or `Function` | Cheerio access method name (like "`html`" for returning html code) or a custom function that take a Cheerio instance as first parameter. |
| **transformer** | `Function`             | The first parameter is your current value for the selected item. Can return a `Promise`.                                                 |
| **listModel**   | `Object`               | Contains the options stated above in case of a list.                                                                                     |

## Example output

```json
{
    "title": "An amazing game",
    "description": "<p>With an amazing description</p>",
    "image": "https://amazing.game/image.jpg",
    "price": 10.99,
    "users": [
        {
            "username": "Tanuki",
            "badges": [
                { "name": "An amazing player" },
                ...
            ]
        },
        ...
    ]
}
```

## The code that goes with it

```js
const { ScrapeTA } = require('scrape-them-all')
ScrapeTA('url_or_https_options', {
  title: '.header h1',
  description: {
    selector: '.header p',
    accessor: 'html',
    //  accessor: selected => selected.html(),
    isTrimmed: false
  },
  image: {
    selector: 'img',
    attribute: 'src'
  },
  price: {
    selector: '.footer #price',
    transformer: (value) => parseFloat(value)
  },
  users: {
    selector: '.body .users',
    listModel: {
      username: '.username',
      badges: {
        selector: '.badges',
        isListItem: true,
        dataModel: {
          name: '.badgeName'
        }
      }
    }
  }
})
  .then((data) => console.log(data))
  .catch((error) => console.error(error))
```

---

#  💪 HOW TO CONTRIBUTE
 TODO

---

# 📜 LICENSE

MIT © [Tanuki](https://github.com/tanukijs), [Aperrix](https://github.com/Aperrix)