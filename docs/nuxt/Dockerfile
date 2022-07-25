FROM amazeeio/node:14-builder as builder

# Build source files.
COPY . /app/
RUN yarn
RUN yarn build
RUN yarn build:docs

# Build static files.
FROM amazeeio/node:14
COPY --from=builder /app/docs /app

RUN yarn
RUN yarn generate

ENV HOST 0.0.0.0
EXPOSE 3000

CMD ["yarn", "start"]
