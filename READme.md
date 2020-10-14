![Scrape Them All](https://i.imgur.com/rhrbozr.png)

**Scrape Them All** try to be easy to use as possible. If you have any suggestion or something not working as you want, please let us know and we'll think and be happy about it.

# 📦 Installation
```sh
# Using NPM
npm install --save scrape-them-all

# Using Yarn
yarn add scrape-them-all
```

# 🚀 Let's begin
## Data model options

|    Option     |         Type          |                                                               Description                                                                |
|---------------|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| **selector**    | `String` or `Object`    | Can be a string expression, DOM Element, array of DOM elements, or cheerio object.                                                       |
| **isListItem**  | `Boolean`           | Indicates that the selector is the parent of a list. Default as false.                                                                   |
| **isTrimmed**   | `Boolean`           | Trim whitespaces in the result. Default as true.                                                                                         |
| **attribute**   | `String`            | Return the value of the indicated attribute on the selected element.                                                                     |
| **accessor**    | `String` or `Function`  | Cheerio access method name (like "`html`" for returning html code) or a custom function that take a Cheerio instance as first parameter. |
| **transformer** | `Function`          | The first parameter is your current value for the selected item. Can return a `Promise`.                                                 |
| **dataModel**   | `Object`            | Contains the options stated above in case of a list.                                                                                     |


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
const { default: ScrapeTA } = require('scrape-them-all')
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
