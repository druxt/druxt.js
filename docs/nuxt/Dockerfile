FROM amazeeio/node:16-builder as builder

# Build source files.
COPY . /app/
RUN corepack enable
RUN yarn || true
RUN yarn build
RUN yarn build:docs

# Build static files.
FROM amazeeio/node:16
COPY --from=builder /app/docs/nuxt /app

# corepack reads docs/nuxt/package.json's own packageManager field (this
# stage only has docs/nuxt, not the monorepo root, so it can't fall back to
# the root's .yarnrc.yml) - without it, this image's pre-installed Yarn
# Classic v1 silently ignores the Yarn Berry lockfile and re-resolves
# dependencies fresh, which can drift onto versions that don't support
# Node 16 (this broke a preview build via cssnano needing Node >=18).
RUN corepack enable
RUN yarn || true
RUN yarn generate

ENV HOST 0.0.0.0
EXPOSE 3000

CMD ["yarn", "start"]
