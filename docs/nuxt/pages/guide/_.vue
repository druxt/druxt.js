<template>
  <div>
    <!-- @TODO: Add breadcrumb / path -->
    <!-- @TODO: Multilingual content support -->
    <DruxtRouter
      class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
      :path="`/en${$route.fullPath}`"
    />
  </div>
</template>
