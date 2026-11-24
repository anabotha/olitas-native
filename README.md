# Olitas 🌊

App móvil con el estado del mar en Comodoro Rivadavia y la costa patagónica. Calcula un puntaje de 0 a 10 para **surf, SUP y natación** a partir de oleaje, viento, marea y temperatura, y avisa cuándo pinta un buen día.

Hecha con **React Native + Expo (SDK 58) y TypeScript**, para la materia Aplicaciones Móviles.

<p>
  <img src="fotos-post/olitas-pantalla-ventanas.jpg" width="220" alt="Pantalla principal con las posibles ventanas del día" />
  <img src="fotos-post/olitas-tarjeta-surf.png" width="220" alt="Tarjeta para compartir el puntaje de surf" />
  <img src="fotos-post/olitas-historia.png" width="220" alt="Historia de Instagram generada por la app" />
</p>

## Funcionalidades principales

- Puntaje por actividad con nivel de peligro y motivos.
- Condiciones hora a hora, marea, mejores ventanas del día y horario de guardavidas.
- **Playa más cercana** por GPS y modo **"estoy en la playa"**.
- **Aviso diario a las 19 h** (notificación local) con cómo viene mañana, recalculado en **segundo plano**.
- **Funciona sin conexión** con el último pronóstico guardado.
- **Arrastrar para actualizar**.
- **Bienvenida** que pide los permisos con contexto.
- Compartir tarjetas por WhatsApp, Instagram o el portapapeles.
- Widget de inicio (iOS), modo oscuro, accesibilidad y soporte para letra grande.

El detalle completo, la arquitectura y la lógica de puntajes están en [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md).

## Instalar en Android

📲 **[Descargar el APK de Olitas](LINK_AL_APK)**

1. Abrí el link desde el celular y descargá el archivo `.apk`.
2. Abrilo desde la notificación de descarga o desde la carpeta **Descargas**.
3. Tocá **Instalar**.

> ⚠️ **La app no se actualiza sola.** No está en Play Store, así que cuando salga una versión nueva hay que **desinstalar la anterior y volver a instalar** desde el link. Al desinstalar se borran las preferencias guardadas (playa elegida, avisos, etc.).

### Alertas que te pueden aparecer

Como la app no viene de Play Store, Android muestra algunos avisos. Son normales:

| Alerta | Qué hacer |
|---|---|
| *"Este tipo de archivo puede dañar tu dispositivo"* (al descargar) | Tocá **Descargar de todas formas**. |
| *"Por tu seguridad, tu teléfono no puede instalar apps desconocidas de esta fuente"* | Tocá **Configuración**, activá **Permitir de esta fuente** y volvé atrás. |
| *"App bloqueada por Play Protect"* / *"Play Protect no reconoce al desarrollador"* | Tocá **Más detalles** → **Instalar de todas formas**. |
| *"¿Enviar la app para que se analice?"* | Podés tocar **No enviar**; la instalación sigue igual. |
| La app pide permiso de **ubicación** y **notificaciones** | Son para la playa más cercana y el aviso diario. Podés negarlos y la app funciona igual. |

Los textos exactos cambian un poco según la marca del celular y la versión de Android.

## Cómo correrla

Requiere **Node 22.13 o más nuevo**.

```bash
npm install
npx expo start
```

- **En el celular:** instalar **Expo Go** y escanear el QR que aparece en la terminal.
- **En un emulador:** apretar `a` (Android) o `i` (iOS, solo en Mac).
- **En el navegador:** apretar `w`. Las notificaciones, el segundo plano y el widget no funcionan en la web.

### APK de prueba (Android)

```bash
npx eas-cli@latest build -p android --profile preview
```

El widget de iOS no funciona en Expo Go: necesita una build propia con cuenta de Apple Developer. Las demás funciones sí andan en Expo Go.

## Tests

```bash
npm test
```

Son pruebas unitarias con Jest + jest-expo sobre la lógica central: geometría del viento, puntajes, guardavidas, playa más cercana y el mensaje del aviso diario. Están en [`__tests__/`](__tests__).

Para chequear los tipos:

```bash
npm run typecheck
```

## Estructura

```
App.tsx          Pantalla principal
components/      Interfaz (tarjetas, selectores, menú, bienvenida, compartir…)
hooks/           Pedido de datos (SWR) y cálculo de puntajes
lib/             Lógica sin interfaz: scoring, geometría, guardavidas,
                 notificaciones, caché sin conexión, ubicación
widgets/         Widget de pantalla de inicio (iOS)
__tests__/       Tests unitarios
docs/            Documentación para el informe
```

## Datos y almacenamiento

- **Clima y mar:** API pública de [Open-Meteo](https://open-meteo.com). No hace falta clave.
- **Sin base de datos:** no hay usuarios ni datos compartidos. Las preferencias, las favoritas y el último pronóstico se guardan en el celular con AsyncStorage.
- **Permisos:**
  - **Ubicación:** solo para elegir la playa más cercana.
  - **Notificaciones:** para el aviso diario.
  - Ninguno de los dos es obligatorio.
