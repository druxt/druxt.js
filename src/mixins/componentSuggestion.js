const DruxtEntityComponentSuggestionMixin = {
  computed: {
    component() {
      for (const suggestion of this.suggestions) {
        if (typeof this.$options.components[suggestion] !== 'undefined') {
          return suggestion
        }
      }

      return 'div'
    },

    suggestions() {
      const suggestions = []

      for (const rule of this.suggestionRules) {
        switch (typeof rule.value) {
          case 'function':
            const result = rule.value(this.tokenContext)
            if (result) {
              suggestions.push(result)
            }
            break

          case 'string':
            suggestions.push(rule.value)
            break
        }
      }

      return suggestions
    },

    suggestionRules() {
      const rules = []

      // Add druxt.entity.suggestions configuration rules.
      if (this.$druxtEntity && Array.isArray(this.$druxtEntity.options.entity.suggestions)) {
        this.$druxtEntity.options.entity.suggestions.map(item => {
          if (item.type === this.tokenType) {
            rules.push(item)
          }
        })
      }

      // Add component default rules.
      if (typeof this.suggestionDefaults !== 'undefined') {
        this.suggestionDefaults.map(item => { rules.push(item) })
      }

      return rules
    },

    tokenContext() {
      return {
        route: this.$store.state.druxtRouter.route,
        tokens: this.tokens,
        ...this.props
      }
    },

    tokenType: () => false
  },

  methods: {
    suggest: (string) => string.replace(/((\b|[^a-z]+)[a-z])/gi, (match, p1, p2) => match.toUpperCase().replace(p2, ''))
  }
}

export { DruxtEntityComponentSuggestionMixin }
