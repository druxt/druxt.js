<template>
  <!-- If user is not logged in, present login form -->
  <div v-if="!isLoggedIn">
    @TODO - Login UI
  </div>

  <!-- If logged in, but no entity is set, render the Content view -->
  <div v-else-if="!entity">
    <DruxtView view-id="content" />
  </div>

  <div v-else>
    <button @click="clearEntity">Close</button>
    <DruxtEntityForm :uuid="entity.id" :type="entity.type" />
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  computed: {
    isLoggedIn: () => true,

    ...mapState({
      entities: state => state.entities
    })
  },

  methods: {
    ...mapMutations(['clearEntities'])
  }
}
</script>
