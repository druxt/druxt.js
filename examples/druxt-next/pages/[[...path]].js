import merge from 'deepmerge'
import { DruxtClient } from 'druxt'
import { DruxtRouter } from 'druxt-router'
import { DruxtSchema } from 'druxt-schema'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const baseUrl = 'https://demo-api.druxtjs.org'

function Route(ctx) {
  const router = useRouter()
  if (ctx.redirect) {
    useEffect(() => router.push(ctx.redirect))
    return (<p>Redirecting...</p>)
  }

  switch ((ctx.route || {}).type) {
    case 'entity': {
      const { entity, schema } = ctx
      const { attributes, relationships } = entity.data

      return (
        <div>
          <h1>{attributes.title}</h1>
          {((schema || {}).fields || []).map((field) => (
            <dl key={field.id}>
              <dt>Field ID</dt>
              <dd>{field.id}</dd>

              <dt>Data</dt>
              <dd>{JSON.stringify(attributes[field.id] || relationships[field.id])}</dd>

              <dt>Schema:</dt>
              <dd>{JSON.stringify(field)}</dd>
            </dl>
          ))}
        </div>
      )
    }

    case 'views': {
      const { displayId, results, view } = ctx
      const { attributes } = view.data

      const display = displayId === 'default'
        ? attributes.display[displayId]
        : merge(attributes.display.default, attributes.display[displayId])

      return (
        <div>
          <h1>{attributes.label}</h1>

          <dl>
            <dt>Results</dt>
            <dd>{results.data.map(entity => (

              <dl key={entity.id}>
                <dt>Title</dt>
                <dd>{entity.attributes.title}</dd>

                <dt>Type</dt>
                <dd>{entity.type}</dd>

                <dt>UUID</dt>
                <dd>{entity.id}</dd>

                <dt>Path</dt>
                <dd><Link href={entity.attributes.path.alias}>{entity.attributes.path.alias}</Link></dd>
              </dl>
            ))}</dd>

            <dt>Display options</dt>
            <dd>{JSON.stringify(display)}</dd>
          </dl>
        </div>
      )
    }
  }

  return (<div>Error: Nothing here!</div>)
}

export async function getServerSideProps({ query, res }) {
  const router = new DruxtRouter(baseUrl)
  const path = ((query || {}).path || []).join('/')
  const { redirect, route } = await router.get(`/${path}`)
  if (redirect) {
    return { props: { redirect } }
  }

  const druxt = new DruxtClient(baseUrl)
  const druxtSchema = new DruxtSchema(baseUrl)

  switch (route.type) {
    case 'entity': {
      const { type, uuid } = route.props
      const [entityType, bundle] = type.split('--')

      const [entity, { schema }] = await Promise.all([
        druxt.getResource(type, uuid),
        druxtSchema.getSchema({ entityType, bundle })
      ])

      return { props: { entity, route, schema }}
    }

    case 'views': {
      const { displayId, type, uuid, viewId } = route.props
      const [view, results] = await Promise.all([
        druxt.getResource(type, uuid),
        druxt.getResource(`views--${viewId}`, displayId)
      ])
      return { props: { displayId, view, results, route } }
    }
  }

  return { props: { route } }
}

export default Route
