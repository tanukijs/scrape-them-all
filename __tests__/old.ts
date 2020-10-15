// import path from 'path'
// import fs from 'fs'
// import fetch from 'node-fetch'
// import { ScrapeTA } from '.'

// export async function downloadImage(imgURL: string, dest: string): Promise<string> {
//   const response = await fetch(imgURL)
//   const name = path.basename(new URL(imgURL).pathname)
//   fs.mkdirSync(dest, { recursive: true })
//   dest = path.join(dest, name)
//   response.body.pipe(fs.createWriteStream(dest))
//   console.log(dest)
//   return dest
// }

// ScrapeTA(
//   { url: 'https://www.dofus.com/fr/mmorpg/encyclopedie/classes', cookieJar: true },
//   {
//     pageName: 'h1.ak-return-link',
//     items: {
//       selector: '.ak-content-sections .ak-breed-section',
//       isListItem: true,
//       dataModel: {
//         title: {
//           selector: '.ak-section-title .ak-text',
//           accessor: (s: cheerio.Cheerio): string | null => s.html()
//         },
//         url: {
//           selector: '.ak-section-title a',
//           attribute: 'href'
//         },
//         illustration: {
//           selector: '.ak-illu',
//           attribute: 'class',
//           transformer: (value: string): Promise<string | null> => {
//             return new Promise((resolve) => {
//               if (!value) {
//                 setTimeout(() => resolve(null as never), 1500)
//                 return
//               }
//               const breedId = value.match(/\d+/)?.[0]
//               const result = breedId
//                 ? `https://static.ankama.com/dofus/ng/modules/mmorpg/encyclopedia/breeds/assets/illu/${breedId}.jpg`
//                 : null
//               setTimeout(() => resolve(result), 1500)
//             })
//           }
//         }
//       }
//     }
//   }
// )
//   .then((data) => console.log(data))
//   .catch((error) => console.error(error))
