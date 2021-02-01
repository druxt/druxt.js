const { DruxtClient } = require('druxt')
const druxt = new DruxtClient('https://demo-api.druxtjs.org')

// Get a page.
druxt.getResource('node--page', 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd', 'fields[node--page]=title').then((resource) => {
  console.log('getResource', resource)
})

// Get a collection of recipes.
druxt.getCollection('node--recipe').then((collection) => {
  console.log('getCollection', collection)
})

// Get all Recipe nodes.
druxt.getCollectionAll('node--recipe').then(collections => {
  console.log('getCollectionAll')
  for (i in collections) {
    const collection = collections[i]
    for (j in collection.data) {
      const resource = collection.data[j]
      console.log(resource.id, resource.attributes.title)
    }
  }
})
