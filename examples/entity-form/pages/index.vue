<template>
  <div>
    <h1>DruxtEntityForm example:</h1>

    <h2>Contact form - Basic</h2>
    <pre><code>&lt;DruxtEntityForm type="contact_message--feedback" /&gt;</code></pre>

    <pre v-if="response">
      <code>{{ JSON.stringify(response, null, '  ') }}</code>
    </pre>

    <DruxtEntityForm
      type="contact_message--feedback"
      @error="setResponse"
      @submit="setResponse"
    />
  </div>
</template>

<script>
export default {
  data: () => ({
    response: null,
  }),
  methods: {
    setResponse(response) {
      this.response = response;
    },
  },
};
</script>
