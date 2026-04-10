# 🎀 Live Dress Up / Juego de Vestir en Vivo

🔗 **[Live Demo / Demo en vivo](https://dressinggame.onrender.com)**

> A gesture-controlled dress-up game with original hand-drawn art.

> Juego de vestir controlado por gestos de la mano y con ilustraciones originales.

---

## About / Acerca del proyecto

**EN** — Style a character hand-drawn by me using only your hand gestures in front of the camera. Built with MediaPipe for real-time hand tracking, React for the UI, and Tailwind CSS for styling. All illustrations and visual design are original.

**ES** — Vestí a un personaje dibujado a mano por mí usando solo gestos frente a la cámara. Construido con MediaPipe para detección de manos en tiempo real, React para la interfaz y Tailwind CSS para los estilos. Todas las ilustraciones y el diseño visual son de autoría propia.

---

## Tech Stack

| | |
|---|---|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| Hand tracking | MediaPipe Tasks Vision |
| Routing | React Router DOM |
| Image export | Canvas API |
| Deploy | Render |

---

## How to play / Cómo jugar

**EN**

1. Allow camera access when prompted
2. Show your **right hand** to the camera
3. Extend only your **index finger**
4. Use swipe gestures to navigate:

| Gesture | Action |
|---|---|
| Swipe left / right | Change current item |
| Swipe up / down | Switch category |

5. Press **Next** when you're happy with the outfit
6. Select a background using left / right swipes
7. Save your final look as a PNG

**ES**

1. Permitir el acceso a la cámara cuando se solicite
2. Mostrá tu **mano derecha** a la cámara
3. Extendé solo tu **dedo índice**
4. Usá gestos de deslizamiento para navegar:

| Gesto | Acción |
|---|---|
| Deslizar izquierda / derecha | Cambiar ítem actual |
| Deslizar arriba / abajo | Cambiar categoría |

5. Presioná **Next** cuando estés satisfecho con el outfit
6. Seleccioná un fondo con deslizamientos izquierda / derecha
7. Guardá tu outfit final como PNG

### Categories / Categorías

`body` · `top` · `bottom` · `shoes` · `nose` · `eyes`

---

## Installation / Instalación

```bash
# Clone the repo / Clonar el repositorio
git clone https://github.com/pamelagiselle8/DressingGame
cd tu-repo

# Install dependencies / Instalar las dependencias
npm install

# Start dev server / Iniciar el servidor
npm run dev
```

### Required files / Archivos necesarios

Place the MediaPipe gesture model in `/public/`:

```
public/
  gesture_recognizer.task   ← download from MediaPipe
  assets/
    sound-effects/
    pixel-buttons/
```

Download `gesture_recognizer.task` from the [MediaPipe Models page](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js).

### Asset structure / Estructura de assets

```
src/
  assets/
    body/
    top/
    bottom/
    shoes/
    nose/
    eyes/
    background/
```


---

## Build / Compilar

```bash
npm run build
npm run preview
```

---

## 💌 Notes / Notas

- Camera permission is required / Se requiere permiso de cámara
- Only available on desktop at the moment / Solo disponible en computadora por el momento
- All illustrations are original artwork / Todas las ilustraciones son de autoría propia

---

*Made with 🩷 — coding, illustrations & design by Pamela Ramírez*