'use strict'

const { createClients } = require('../src/index')
const { createFixtureAxios } = require('./adapter')

const clients = createClients('http://backend.example', { axios: createFixtureAxios() })

module.exports = { clients }
