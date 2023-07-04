FROM amazeeio/node:16-builder as builder

# Build source files.
COPY . /app/
RUN yarn || true
RUN yarn build
RUN yarn build:docs

# Build static files.
FROM amazeeio/node:16
COPY --from=builder /app/docs/nuxt /app

RUN yarn || true
RUN yarn generate

ENV HOST 0.0.0.0
EXPOSE 3000

CMD ["yarn", "start"]
