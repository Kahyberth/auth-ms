
# Usar una imagen base con Bun
FROM node:18-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar las dependencias del sistema necesarias (libstdc++)
RUN apk add --no-cache libstdc++

# Copiar el archivo package.json y bun.lockb (si existe)
COPY package*.json ./

# Instalar las dependencias usando Bun
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Compilar la aplicación (si es necesario)
RUN npm run build

# Exponer el puerto en el que corre la aplicación
EXPOSE 3004

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start:prod"]