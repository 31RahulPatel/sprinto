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

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
# Needed for `prisma migrate deploy` to run inside this image — it reads schema.prisma to
# locate the migrations folder and datasource, which the compiled dist/ output doesn't carry.
COPY --from=build /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main"]
