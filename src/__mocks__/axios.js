import mockAxios from 'jest-mock-axios'
import qs from 'qs'

mockAxios.get = jest.fn((url, options) => {
  const urlParts = url.split('?')
  const query = qs.parse(urlParts[1])

  let offset = 0
  const limit = 5

  const links = {}
  if (!query.page) {
    offset = limit
    links.next = links.last = {
      href: urlParts[0] + '?' + qs.stringify({
        ...query,
        'page[offset]': offset,
        'page[limit]': limit
      })
    }
  }

  let data = []
  for (let id = offset; id < offset + limit ; id++) {
    let parent = `menu_link_content:${id - 1}`
    if (id === offset) {
      parent = null
    }

    data[id] = {
      id,
      attributes: {
        menu_name: 'main',
        parent
      }
    }
  }

  return { data: { data, links } }
})

export default mockAxios
