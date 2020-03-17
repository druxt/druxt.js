import mockResources from '../__fixtures__/resources'
import mockRoutes from '../__fixtures__/routes'

class DruxtRouter {
  async get (path) {
    const route = mockRoutes[path]
    const entity = mockResources[`/api/${route.entity.type}/${route.entity.bundle}/${route.entity.uuid}`]

    return { entity, route }
  }
}

export { DruxtRouter }
