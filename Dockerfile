# Gunakan image Node.js yang ringan
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependensi (termasuk devDependencies untuk keperluan build dan Prisma)
RUN npm install

# Salin seluruh source code ke dalam container
COPY . .

# Generate Prisma Client (penting sebelum build/jalankan)
RUN npx prisma generate

# Build TypeScript menjadi JavaScript (menghasilkan folder dist)
RUN npm run build

# Expose port aplikasi
EXPOSE 5000

# Jalankan skrip start:prod (migrasi db lalu jalankan app)
CMD ["npm", "run", "start:prod"]
