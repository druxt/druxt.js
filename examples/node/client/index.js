const { DruxtClient } = require('druxt')

const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : process.env.BASE_URL || 'http://drupal-9.ddev.site'

const druxt = new DruxtClient(baseUrl)

// Get a page.
druxt.getResource('node--page', 'cd44fe14-86ae-4853-8e22-7b1b73cd98f5', 'fields[node--page]=title').then((resource) => {
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
