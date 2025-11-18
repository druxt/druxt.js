<template>
  <div>
    <h1>Test Deprecated Field Components</h1>
    <p>
      This page tests that deprecated field components emit proper console
      warnings.
    </p>

    <div data-cy="deprecated-components-container">
      <!-- Test deprecated field components -->
      <DruxtFieldTextDefault
        :value="[{ processed: 'Test content' }]"
        :schema="{}"
      />

      <DruxtFieldTextTrimmed
        :value="[{ value: 'This is a long text that should be trimmed.' }]"
        :schema="{ settings: { display: { trim_length: 50 } } }"
      />

      <DruxtFieldNumberInteger
        :value="[42, 24, 12]"
        :schema="{
          settings: {
            display: { prefix_suffix: true },
            config: { prefix: '$', suffix: '.00' },
          },
        }"
      />

      <DruxtFieldLink
        :value="[{ title: 'Test Link', uri: 'https://example.com' }]"
        :schema="{}"
      />
    </div>
  </div>
</template>

<script>
import DruxtFieldTextDefault from 'druxt-entity/dist/components/fields/DruxtFieldTextDefault.vue'
import DruxtFieldTextTrimmed from 'druxt-entity/dist/components/fields/DruxtFieldTextTrimmed.vue'
import DruxtFieldNumberInteger from 'druxt-entity/dist/components/fields/DruxtFieldNumberInteger.vue'
import DruxtFieldLink from 'druxt-entity/dist/components/fields/DruxtFieldLink.vue'

export default {
  name: 'TestDeprecatedWarnings',
  components: {
    DruxtFieldTextDefault,
    DruxtFieldTextTrimmed,
    DruxtFieldNumberInteger,
    DruxtFieldLink,
  },
}
</script>
