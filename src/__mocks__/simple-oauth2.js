const create = config => ({
  ownerPassword: ({
    getToken: token => {
      if (!token.username) return new Error('Test error')
      return {
        token_type: 'token_type',
        access_token: 'access_token'
      }
    }
  })
})

export { create }
