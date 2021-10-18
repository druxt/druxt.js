<template>
  <div>
    <div class="card container mx-auto my-8 lg:card-side bordered">
      <figure>
        <img src="https://picsum.photos/id/1005/400/250">
      </figure>
      <div class="card-body">
        <h2 class="card-title">Horizontal
          <div class="badge mx-2">NEW</div>
        </h2>
        <p>Rerum reiciendis beatae tenetur excepturi aut pariatur est eos. Sit sit necessitatibus veritatis sed molestiae voluptates incidunt iure sapiente.</p>
        <div class="card-actions">
          <button class="btn btn-primary">Read more</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 container mx-auto my-8">
      <div class="card text-center shadow-2xl">
        <figure class="px-10 pt-10">
          <img src="https://picsum.photos/id/1005/400/250" class="rounded-xl">
        </figure>
        <div class="card-body">
          <h2 class="card-title">shadow, center, padding</h2>
          <p>Rerum reiciendis beatae tenetur excepturi aut pariatur est eos. Sit sit necessitatibus veritatis sed molestiae voluptates incidunt iure sapiente.</p>
          <div class="justify-center card-actions">
            <button class="btn btn-outline btn-accent">More info</button>
          </div>
        </div>
      </div>
      <div class="card shadow-xl image-full">
        <figure>
          <img src="https://picsum.photos/id/1005/400/250">
        </figure>
        <div class="justify-end card-body">
          <h2 class="card-title">Image overlay</h2>
          <p>Rerum reiciendis beatae tenetur excepturi aut pariatur est eos. Sit sit necessitatibus veritatis sed molestiae voluptates incidunt iure sapiente.</p>
          <div class="card-actions">
            <button class="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>
      <div class="card shadow-sm bg-accent text-accent-content">
        <figure>
          <img src="https://picsum.photos/id/1005/400/250">
        </figure>
        <div class="card-body">
          <h2 class="card-title">Accent color</h2>
          <p>Rerum reiciendis beatae tenetur excepturi aut pariatur est eos. Sit sit necessitatibus veritatis sed molestiae voluptates incidunt iure sapiente.</p>
          <div class="card-actions">
            <button class="btn btn-secondary">More info</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
