# Guía de Despliegue en GitHub Pages

Para publicar tu aplicación en GitHub Pages, sigue estos pasos:

### 1. Preparación

He configurado `vite.config.js` con `base: './'` y añadido los scripts necesarios en `package.json`.

### 2. Instalación de Herramientas

Ejecuta el siguiente comando en tu terminal para instalar la utilidad de despliegue:

```bash
npm install --save-dev gh-pages
```

### 3. Configuración de Git

Asegúrate de que tu proyecto esté en un repositorio de GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPOSIORIO.git
git push -u origin main
```

### 4. Desplegar

Simplemente ejecuta:

```bash
npm run deploy
```

La aplicación estará disponible en `https://TU_USUARIO.github.io/TU_REPOSIORIO/`
