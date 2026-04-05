# Hand Recognition - Dress Up Game (Web Version)

Una aplicación web interactiva para vestir personajes usando gestos de mano detectados por cámara.

## Características

- 📹 Captura de video en tiempo real desde cámara web
- 🎨 Selecciona entre múltiples personajes
- ✋ Control por gestos: cierra la mano con el índice extendido y muévela izquierda/derecha
- 💾 Guarda imágenes de tus personajes
- 🌐 Compatible con cualquier navegador moderno

## Instalación Local

### Requisitos
- Python 3.8+
- pip
- Cámara web

### Pasos

1. **Clonar repositorio**
```bash
git clone <repo-url>
cd HandRecognition
```

2. **Crear entorno virtual**
```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# o
venv\Scripts\activate  # Windows
```

3. **Instalar dependencias**
```bash
pip install -r requirements_flask.txt
```

4. **Ejecutar la aplicación**
```bash
python app_flask.py
```

5. **Abrir en navegador**
```
http://localhost:5000
```

## Estructura de carpetas

```
HandRecognition/
├── app_flask.py              # Backend Flask
├── gesture_recognizer.task   # Modelo de MediaPipe
├── requirements_flask.txt    # Dependencias
├── Procfile                  # Para deploy en Heroku/Railway
├── templates/
│   └── index.html           # Frontend HTML/CSS/JS
└── body/
    ├── character1.png
    ├── character2.png
    └── ...
```

## Deploy en Heroku

1. **Crear cuenta** en [Heroku](https://heroku.com)

2. **Instalar Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows/Linux
# Descargar desde https://devcenter.heroku.com/articles/heroku-cli
```

3. **Login en Heroku**
```bash
heroku login
```

4. **Crear app**
```bash
heroku create nombre-de-tu-app
```

5. **Deploy**
```bash
git push heroku main
```

6. **Ver logs**
```bash
heroku logs --tail
```

## Deploy en Railway

1. **Crear cuenta** en [Railway](https://railway.app)

2. **Conectar repositorio GitHub**
   - Ir a Dashboard → New Project → GitHub Repo
   - Seleccionar tu repositorio

3. **Configurar**
   - Railway detectará automáticamente que es Python
   - Agregará variables de entorno necesarias

4. **Deploy automático**
   - Cada push a main hará deploy automáticamente

## Deploy en Render

1. **Crear cuenta** en [Render](https://render.com)

2. **Crear nuevo Web Service**
   - New → Web Service
   - Conectar repositorio
   - Build command: `pip install -r requirements_flask.txt`
   - Start command: `gunicorn app_flask:app`

3. **Deploy**
   - Render hará deploy automáticamente

## Uso

### Con cámara
1. Click en "Start Camera"
2. Activa la cámara cuando lo pida el navegador
3. Cierra la mano dejando el índice extendido
4. Mueve la mano izquierda o derecha para cambiar personaje
5. Click en "Save Character" para guardar la imagen

### Atajos de teclado
- **S**: Guardar personaje
- **←/→**: Cambiar personaje

## Notas importantes para deploy en la nube

⚠️ **Limitación importante**: 
- La cámara **solo funciona localmente** o en HTTPS
- La mayoría de plataformas gratuitas NO soportan HTTPS para aplicaciones Python
- **Solución recomendada**: Usar esta app localmente o en tu propio servidor con SSL

## Alternativas para deploy en la nube

### Opción 1: Deploy Local con Ngrok
```bash
pip install ngrok
ngrok http 5000
```

### Opción 2: AWS/Azure/Google Cloud
Estos servicios permiten HTTPS y son ideales para producción.

### Opción 3: Tu propio servidor
- VPS en DigitalOcean, Linode, etc.
- Configurar Nginx + SSL con Let's Encrypt

## Troubleshooting

### "No body images found"
- Verifica que la carpeta `body/` existe
- Contiene archivos .png
- Son imágenes PNG con transparencia

### Camera no funciona
- Verifica que el navegador tiene permiso de cámara
- Recarga la página (F5)
- Intenta en otra ventana de incógnito

### MediaPipe error
- Reinstala: `pip install --upgrade mediapipe`
- Verifica: `python -c "import mediapipe; print(mediapipe.__version__)"`

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor:
1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

MIT License - ver LICENSE.md

## Autor

Pamela Ramirez

## Preguntas frecuentes

**P: ¿Funciona en móvil?**
R: Sí, pero la experiencia es mejor en desktop.

**P: ¿Se guardan las imágenes en la nube?**
R: Localmente se guardan en la carpeta principal. Para guardar en la nube, necesitarías integrar S3/Google Cloud Storage.

**P: ¿Cómo agrego más personajes?**
R: Agrega archivos PNG con transparencia a la carpeta `body/`. Se cargan automáticamente.
