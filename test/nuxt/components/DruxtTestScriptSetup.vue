<script setup lang="ts">
// A module in <script setup>: no `name`, so its name comes from this file, and it renders its render function as a component.
import { druxtModuleEmits, druxtModuleProps, useDruxtModule } from '@druxt/core/runtime'

const props = defineProps(druxtModuleProps)
defineEmits([...druxtModuleEmits])
const Module = useDruxtModule(props, {
  componentOptions: () => [['default']],
  propsData: () => ({ title: 'From script setup' }),
})
</script>

<template>
  <Module />
</template>
