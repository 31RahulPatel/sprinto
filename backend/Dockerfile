FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Debian, not Alpine, specifically for this stage — Prowler's dependency tree (cryptography,
# etc.) ships prebuilt manylinux wheels for glibc but not musl, so installing it on Alpine means
# compiling those from source (slow, and needs a build toolchain this image doesn't otherwise
# need). Runs `prowler` directly rather than `docker run toniblyx/prowler` so this container
# never needs Docker socket access — that would hand it root-equivalent control over every other
# container on the host, not just this app.
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install --no-cache-dir --break-system-packages prowler
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
# Needed for `prisma migrate deploy` to run inside this image — it reads schema.prisma to
# locate the migrations folder and datasource, which the compiled dist/ output doesn't carry.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 4000
CMD ["node", "dist/main"]
