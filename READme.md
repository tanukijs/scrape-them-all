# 📦 Installation
```sh
# Using NPM
npm install --save scrape-them-all

# Using Yarn
yarn add scraper-them-all
```

# 🚀 Let's begin
Scrape Them All try to be easy to use as possible. If you have any suggestion or something not working as you want, please let us know and we'll think about it.

## Data model options
- `selector` _(String, Object)_ Can be a string expression, DOM Element, array of DOM elements, or cheerio object.
- `isListItem` _(Boolean)_ Indicates that the selector is the parent of a list. Default as false.
- `isTrimmed` _(Boolean)_ Trim whitespaces in the result. Default as true.
- `attribute` _(String)_ Return the value of the indicated attribute on the selected element.
- `accessor` _(String, Function)_ Cheerio access method name (like "`html`" for returning html code) or a custom function that take a Cheerio instance as first parameter.
- `transformer` _(Function)_ The first parameter is your current value for the selected item. Can return a `Promise`.
- `dataModel` _(Object)_ Contains the options stated above in case of a list.

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
const ScrapeTA = require('scrape-them-all')
ScrapeTA('your_url_or_https_request_object', {
    title: '.header h1',
    description: {
        selector: '.header p',
        accessor: 'html',
//      accessor: selected => selected.html(),
        isTrimmed: false
    },
    image: {
        selector: 'img',
        attribute: 'src'
    },
    price: {
        selector: '.footer #price',
        transformer: value => parseFloat(value)
    },
    users: {
        selector: '.body .users',
        isListItem: true,
        dataModel: {
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
.then(data => console.log(data))
.catch(error => console.error(error))
```