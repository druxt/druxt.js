// What the server holds: the private config, and the settings with the server tier.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as unknown as { druxt: unknown }
  return { private: config.druxt, settings: await useDruxtServerSettings(event) }
})
