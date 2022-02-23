const baseUrl = `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`

export default {
  buildModules: [
    '@nuxtjs/auth-next',
    ['druxt', { baseUrl }],
  ],

  auth: {
    redirect: {
      callback: '/callback',
      logout: '/',
    },
    strategies: {
      drupal: {
        scheme: 'oauth2',
        endpoints: {
          authorization: baseUrl + '/oauth/authorize',
          token: baseUrl + '/oauth/token',
          userInfo: baseUrl + '/oauth/userinfo',
        },
        clientId: process.env.OAUTH_CLIENT_ID,
        responseType: 'code',
        grantType: 'authorization_code',
        codeChallengeMethod: 'S256',
      },
    },
  },
}
