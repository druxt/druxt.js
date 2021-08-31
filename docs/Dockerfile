FROM amazeeio/node:14

COPY . /app/
RUN yarn

# Build Nuxt codebase.
RUN yarn generate

ENV HOST 0.0.0.0
EXPOSE 3000

CMD ["yarn", "start"]
