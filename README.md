<p align="center"> <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a> </p> <h1 align="center">Auth Microservice</h1> <p align="center"> El microservicio de autenticación de <strong>TaskMate</strong> gestiona el registro, login, verificación y emisión de tokens para usuarios. Construido con <a href="http://nestjs.com/" target="_blank">NestJS</a>, Docker, Redis y NATS, garantiza un control seguro y escalable de identidad en el ecosistema distribuido. </p>

---

## 🚀 Características

- **Registro y login de usuarios:** Endpoints seguros para autenticación y creación de cuentas.
- **JWT tokens**: Generación y validación de tokens de acceso.
- **Hashing de contraseñas:**: Uso de bcrypt para proteger las credenciales de los usuarios.
- **Autenticación y autorización**: Interceptores y guards centralizados para validar tokens y permisos antes de enrutar la petición.
- **Comunicación por eventos**: Publica eventos (como auth.create.user) y escucha comandos a través de NATS.

---

## 🛠️ Requisitos previos

Asegúrate de tener instalados los siguientes elementos en tu máquina:

- [Node.js](https://nodejs.org/) (v16 o superior recomendado)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [TypeORM](https://typeorm.io/)

---

## 📦 Instalación

Sigue estos pasos para configurar el entorno local:

1. Clona el repositorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DEL_REPOSITORIO>

   ```

2. Ejecuta el siguiente comando para instalar las dependencias

```
npm install
```

## 💾 Genera y migra las tablas

Antes de usar el microservicio hay que asegurarse de generar las tablas y despues migrarlas

1. Usa el comando `npm run db:gen ` para generar las tablas

2. Usa el comando `npm run db:migrate` para migrar las tablas

## 🖥️ Uso

Asegúrate de estar dentro de la carpeta del proyecto

1. Levanta el servidor Nats

```
 docker-compose run -d
```

2. Ejecuta el comando para correr el microservicio

```
  npm run start:dev
```

## Run tests

```bash
# unit tests
$ npm run test
```
