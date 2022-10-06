<template>
  <div class="container mx-auto my-20 px-5">
    <h1 class="text-4xl text-primary border-b mb-10">API Documentation</h1>

    <NuxtChild keep-alive :key="$route.fullPath" />
  </div>
</template>
