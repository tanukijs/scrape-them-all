import ScrapeTA from './src/index'

ScrapeTA('https://www.dofus.com/fr/mmorpg/encyclopedie/classes', {
    pageName: 'h1.ak-return-link',
    items: {
        selector: '.ak-content-sections .ak-breed-section',
        isListItem: true,
        dataModel: {
            title: '.ak-section-title .ak-text',
            url: {
                selector: '.ak-section-title a',
                attribute: 'href'
            },
            illustration: {
                selector: '.ak-illu',
                attribute: 'class',
                transformer: (value) => {
                    if (!value) return null
                    const breedId = value.match(/\d+/)[0] || null
                    return !breedId
                        ? null
                        : `https://static.ankama.com/dofus/ng/modules/mmorpg/encyclopedia/breeds/assets/illu/${breedId}.jpg`
                }
            }
        }
    }
})
    .then(console.log)
    .catch(console.error)
