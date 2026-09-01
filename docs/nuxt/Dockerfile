FROM amazeeio/node:16-builder@sha256:4dd9a540c732a011258fec4ef1465bda8641c91c77939ca9e494c53a2ff7ef1c AS builder

# Build source files.
COPY . /app/
RUN corepack enable
RUN yarn || true
RUN yarn build
RUN yarn build:docs

# Build static files.
FROM amazeeio/node:16@sha256:11f2d4ce2e741dbdc87cf4929e3a30f0d06ece1e137b33073aa291154d067316
COPY --from=builder /app/docs/nuxt /app

# corepack reads docs/nuxt/package.json's own packageManager field (this
# stage only has docs/nuxt, not the monorepo root, so it can't fall back to
# the root's .yarnrc.yml) - without it, this image's pre-installed Yarn
# Classic v1 silently ignores the Yarn Berry lockfile and re-resolves
# dependencies fresh, which can drift onto versions that don't support
# Node 16 (this broke a preview build via cssnano needing Node >=18).
RUN corepack enable
RUN yarn || true

# Lagoon passes this as a build arg, but only declared args reach the build.
# It gates the analytics snippet baked in at generate time. Routes are
# runtime-only in Lagoon, so scripts/rewrite-origin.sh resolves the origin at
# container start instead.
ARG LAGOON_ENVIRONMENT_TYPE
RUN yarn generate

ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["sh", "scripts/start.sh"]
