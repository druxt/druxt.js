import { mapState } from 'vuex'

export default {
  computed: {
    entity () {
      return this.entities[this.route.entity.uuid]
    },

    title () {
      return this.route.label
    },

    ...mapState({
      entities: state => state.druxtRouter.entities,
      route: state => state.druxtRouter.route,
      schema: state => state.druxtRouter.schema
    })
  }
}
