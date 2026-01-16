---
title: "Blog del Proyecto KWin en GSoC'25: Semanas 3-4"
authors:
  -  yorisoft
date: 2025-09-15
SPDX-License-Identifier: CC-BY-SA-4.0
SPDX-FileCopyrightText: 2025 Yelsin Sepulveda <yelsin.sepulveda@kdemail.net>
---

# Plugin de KWin Gamepad: Semanas 3-4

Continuando desde las semanas 1+2 (investigación + prototipos con libevdev/uinput), estas dos últimas semanas se trataron de pasar del "modo solo investigación" a convertir ideas en lógica de programación que vive dentro de KWin para: detectar controladores de juegos y sus eventos de entrada, mantener Plasma despierto con actividad del controlador, manejar conexión en caliente y conexiones preexistentes al inicio, y establecer los primeros mapeos de entrada del controlador a acciones de teclado/ratón sin interferir con otras aplicaciones que utilizan los controladores.

Desde el principio, mis mentores y yo hemos tenido una idea general de las características que queríamos agregar pero no estábamos muy seguros de cómo implementarlas. Después de pensar y experimentar, me aconsejaron comenzar con un KWin::Plugin. Esto nos permitiría comenzar a introducir las funcionalidades del controlador de juegos a KWin mientras evitamos tener que editar el núcleo o las entrañas de KWin. También sería un gran punto de entrada para los objetivos actuales y futuros de entrada del controlador de juegos, permitiéndonos comenzar pequeños con un plugin de KWin de primera parte, construir sobre él, y posiblemente integrarlo en la funcionalidad principal.

Cuando se trata de crear plugins de Kwin tenía algunas opciones:
- Scripts: Escritos en QML/JavaScript y usados para automatizar la gestión de ventanas, mosaicos, atajos, etc.
- Effects: Implementar efectos visuales en ventanas, el escritorio, o transiciones.
- Core/Native: Estos están integrados en KWin mismo y extienden la funcionalidad interna de KWin.

Dado que el plugin necesita acceso a dispositivos de bajo nivel, como monitorear `/dev/input/event*`, escuchar hot-plugs de `udev`, abrir fds, y reaccionar a eventos de `evdev`, la mejor opción fue ir con el plugin Core / Native. A diferencia de los plugins Effect y Script que no están diseñados para abrir dispositivos o hacer E/S de larga duración, la mayoría simplemente viven dentro de las capas de renderizado/scripting.

Comencé buscando un ejemplo de cómo construir un plugin de KWin para poder empezar a aprender cómo construir el mío propio. Afortunadamente mi mentor @zamundaaa me proporcionó algunos ejemplos excelentes:
- Plugin de ejemplo / tutorial ubicado en `src/plugin/examples/plugin`
- Plugin de capturas de pantalla ubicado en `src/plugins`

Entre estos dos ejemplos y la mentoría pude armar el andamiaje (partes esenciales) de un plugin de KWin y pude juntar la primera versión de este plugin, el plugin `gamepad`, ubicado en: `kwin/src/plugins/gamepad`. En este punto el plugin está estructurado como sigue:
```
main.cpp                // Punto de entrada y define la clase GamepadManagerFactory
metadata.json           // Declara el plugin a KWin, define información sobre el plugin
CMakeLists.txt          // Cableado de construcción/instalación/registro de C++
gamepadManager.{cpp/h}  // Lógica del plugin: Define la clase GamepadManager
gamepadManager.{cpp/h}  // Lógica del plugin: Define la clase Gamepad
```

## Notas de implementación

### GamepadManagerFactory
La clase `GamepadManagerFactory` sirve simplemente como el punto de entrada para el plugin. Es una clase factory, o una clase usada para crear otras clases / tipos de objetos. Como los ejemplos, hereda de `PluginFactory` y la declara como su interfaz así como apunta al archivo `metadata.json` para este plugin. Inicializa el plugin a través de su función `create()` que devuelve un `GamepadManager`.

### GamepadManager
La clase `GamepadManager` sirve como el coordinador central (el "cerebro" o "hub") de todo el proyecto. Mientras creaba esto tomé mucha inspiración de `src/backend/drm/drm_backend.{cpp/h}`, que en sí mismo es responsable de manejar dispositivos drm/gpu. `GamepadManager` cubre muchas responsabilidades. Posee y gestiona todos los dispositivos gamepad, maneja el descubrimiento (enumeración de inicio, hot-plug), ciclo de vida (agregar/remover), y comunicación (señales cuando se agregan/remueven pads, o cuando cambia su estado). En general es responsable de mantener un registro del conjunto actual de controladores y su estado.

#### Detectar hot-plug y detección de dispositivos preexistentes:
Para esta parte se usaron muchos de los patrones del backend DRM. Lo primero que hace la clase manager en la inicialización es crear dos `QMetaObject::Connection`s que monitorean la sesión actual de KWin para señales `devicePaused` y `deviceResumed`. Esto ayuda a **rastrear dispositivos cuando Plasma entra y sale de sleep/suspend** lo que causa que los dispositivos sean Pausados y Resumidos. Luego enumera sobre todos los dispositivos de eventos ubicados en `/dev/input/event*` para **manejar cualquier conexión preexistente a controladores de juegos**. Si descubre un dispositivo de eventos agrega el gamepad (comenzar a rastrearlo y su entrada).
```cpp
// En init:
// Enumerar nodos de entrada actuales para filtrar y agregar SOLO nodos de eventos
QDir dir(QStringLiteral("/dev/input"));
const auto files = dir.entryList({QStringLiteral("event*")}, QDir::Files | QDir::Readable | QDir::System);
for (const QString &file : files) {
    const QString path = dir.absoluteFilePath(file);
    if (!isTracked(path)) {
        addGamepad(path);
    }
}
```

Finalmente usando `udev` monitorea los subsistemas y filtra solo por eventos del subsistema "input". Usa `QSocketNotifier` para producir notificaciones de señal de eventos de `udev` y crea una conexión entre ese notificador y una función miembro, `handleUdevEvent`, que maneja eventos provenientes del monitor de `udev` cuando se detecta un dispositivo de entrada. Se realizan algunas verificaciones para verificar si el dispositivo es un controlador de juegos, como eventos de entrada esperados y tipos de eventos de entrada. Esto incluye eventos de entrada como `BTN_JOYSTICK` y `BTN_GAMEPAD`, que comúnmente se definen en controladores de juegos. Así como verificar capacidades de joystick o D-pad. Si las verificaciones pasan el controlador de juegos es "agregado", o en otras palabras, el dispositivo es envuelto en una clase `Gamepad`, mantenido en registro y su presencia monitoreada.
```cpp
// configurar udevMonitor
if (m_udevMonitor) {
    m_udevMonitor->filterSubsystemDevType("input");
    const int fd = m_udevMonitor->fd();
    if (fd != -1) {
        m_socketNotifier = std::make_unique<QSocketNotifier>(fd, QSocketNotifier::Read);
        connect(m_socketNotifier.get(), &QSocketNotifier::activated, this, &GamepadManager::handleUdevEvent);
        m_udevMonitor->enable();
    }
}
```

### Gamepad
`Gamepad` es una clase wrapper. Su propósito es estar vinculada a un controlador físico. Un objeto `Gamepad` por controlador de juegos físico. Esto permite acceso/referencia rápido al dispositivo y permite que el controlador físico sea tratado como un objeto. Esta clase también es responsable del manejo de entrada del dispositivo, actualización de Idle de Plasma, y mapeos de botón a teclado/ratón. En el futuro las cosas podrían dividirse en archivos separados pero tal como está, maneja mucho. Como con el `GamepadManager`, esta clase toma mucha inspiración de los patrones del backend DRM.

#### Detectar eventos de entrada:
Una vez que se detecta un dispositivo controlador de juegos se envuelve en un objeto de clase `Gamepad`. Que a su vez envuelve el controlador en un puntero de objeto `libevdev`. Esta es la parte que da acceso al controlador a través de la API de `libevdev`, haciendo más fácil trabajar con él y monitorear sus eventos de entrada. Como `GamepadManager`, lo primero que hace esta clase es usar `QSocketNotifier` para producir notificaciones del `fd` de los controladores, es decir, monitorear entrada. Luego crea una conexión entre ese notificador y una función miembro, `handleEvdevEvent`, que **maneja todos los eventos de entrada entrantes de ese dispositivo**.
```cpp
libevdev *evdev = createEvDevice();
if (evdev) {
    m_evdev.reset(evdev);

    m_notifier = std::make_unique<QSocketNotifier>(m_fd, QSocketNotifier::Read, this);
    connect(m_notifier.get(), &QSocketNotifier::activated, this, &Gamepad::handleEvdevEvent);

    qCDebug(KWIN_GAMEPAD) << "Connected to Gamepad ( new libevdev* ): " << libevdev_get_name(m_evdev.get()) << "at" << m_path;
}
```

#### Actualización de Idle de Plasma con actividad del controlador
Con la capacidad de monitorear todos los eventos de entrada del dispositivo, el plugin luego usa esa información para saber cuándo reiniciar el temporizador idle de Plasma. Para esto `Gamepad` importa/incluye el archivo `input.h` y hace una llamada a `input()->simulateUserActivity()` cuando se detecta un evento de entrada del controlador. Esto causa que el temporizador idle de Plasma se reinicie y **previene que el sistema entre en modo sleep/suspend mientras usa solo el controlador de juegos**.
```cpp
// reiniciar tiempo idle
input()->simulateUserActivity();
```

#### Mapeo Controlador -> Teclado y Ratón
`Gamepad` usa funciones API de `libevdev` para verificar eventos de entrada, identificar el evento de entrada específico y mapear eso a un evento de entrada de teclado o ratón. Usando `libevdev_next_event()` verifica el evento de entrada proveniente de ese controlador de juegos. Luego identifica el evento de entrada específico a través de su `tipo`, `código`, y `valor` de evento de entrada. Para simular un ratón y teclado se importa el archivo `core/inputdevice.h` y se usa para declarar `GenericInputDevice` que hereda de `InputDevice`. Ese `GenericInputDevice` efectivamente se comporta como un teclado virtual y ratón dentro de la pila de entrada de KWin.

Cuando se identifican eventos de entrada específicos de `libevdev`, como `EV_KEY` + `BTN_SOUTH` (presión del botón A) O `EV_KEY` + `BTN_EAST` (presión del botón B), llama a `InputDevice::sendKey()` para **simular presión de tecla de teclado e inyectar las teclas deseadas en el pipeline de entrada de Kwin**. En este caso `Enter` para A (`BTN_SOUTH`) y `Escape` para B (`BTN_EAST`). Para emular ratón/puntero el plugin hace llamadas a `InputDevice::sendPointerButton()` para botones izquierdo y derecho del ratón, y `InputDevice::sendPointerMotionDelta()` para movimiento del puntero.
Aquí está una lista de todos los mapeos de botones a teclado/ratón:

![architecture_diagram_0](images/kwin_plugin_gamepad_architecture_diagram_0.png) 
![architecture_diagram_1](images/kwin_plugin_gamepad_architecture_diagram_1.png) 
![architecture_diagram_2](images/kwin_plugin_gamepad_architecture_diagram_2.png) 
![architecture_diagram_3](images/kwin_plugin_gamepad_architecture_diagram_3.png) 

```
Botones de Cara
---------------
BTN_SOUTH  → Enter (Qt::Key_Return)
BTN_EAST   → Escape (Qt::Key_Escape)
BTN_NORTH
BTN_WEST

Bumpers
-------
BTN_TL     → Alt (Qt::Key_Alt)
BTN_TR     → Tab (Qt::Key_Tab)

Botones de Gatillo
------------------
ABS_Z      → Clic Izquierdo del Ratón
ABS_RZ     → Clic Derecho del Ratón

D-Pad
-----
BTN_DPAD_LEFT   → Flecha Izquierda  (Qt::Key_Left)
BTN_DPAD_RIGHT  → Flecha Derecha    (Qt::Key_Right)
BTN_DPAD_UP     → Flecha Arriba     (Qt::Key_Up)
BTN_DPAD_DOWN   → Flecha Abajo      (Qt::Key_Down)

Sticks Analógicos
-----------------
ABS_RX / ABS_RY → Movimiento del Puntero

Botones Centrales
-----------------
BTN_SELECT → Mostrar Teclado en Pantalla ( WIP )
BTN_START  → Meta/Super (Qt::Key_Meta)

```

#### Prevenir interferir con otras aplicaciones

Es esencial que el plugin no emule teclado y ratón para el mando cuando otra aplicación lo está utilizando. Muy probablemente, en esos casos el dispositivo está siendo usado para otra cosa y no para navegar por el escritorio.

Para lograrlo, la clase GamepadManager crea una instancia de un objeto inotify, y añade un watch device al fd de cada mando que se añade como Gamepad. Cada vez que inotify produce una notificación se llama a la función GamepadManager::handleFdAccess, la cual incrementa el contador en Gamepad, Gamepad::m_usageCount, en +1 si el valor del evento es IN_OPEN, o lo decrementa en -1 si el valor del evento es IN_CLOSE_WRITE | IN_CLOSE_NOWRITE.

El plugin solo intentará emular teclado/ratón si m_usageCount es 0. Esto previene la emulación de teclado y ratón cuando otras aplicaciones tienen abierto o están usando el mando.
```cpp
// Procesar todos los eventos inotify en el buffer
for (char *ptr = buffer; ptr < buffer + length;) {
    struct inotify_event *event = reinterpret_cast<struct inotify_event *>(ptr);

    auto it = m_watchesToGamepads.find(event->wd);
    if (it != m_watchesToGamepads.end()) {
        Gamepad *pad = it.value();
        if (event->mask & IN_OPEN) {
            pad->setGrabbed(true);
            qCDebug(KWIN_GAMEPAD) << "Device" << pad->path() << "grab status:" << true;
        } else if (event->mask & (IN_CLOSE_WRITE | IN_CLOSE_NOWRITE)) {
            pad->setGrabbed(false);
            qCDebug(KWIN_GAMEPAD) << "Device" << pad->path() << "grab status:" << false;
        }
    }
    ptr += sizeof(struct inotify_event) + event->len;
}
```

#### Opt-In
Muchos de los plugins nativos que se envían con KWin están habilitados por defecto pero para nuestro plugin de controlador de juegos lo deshabilitaremos por defecto y lo haremos una opción opt-in. Esto permitirá a los usuarios comenzar a experimentar y beneficiarse del plugin sin arriesgar la posibilidad de romper la entrada actual del controlador de juegos en su sistema.
```json
{
    "KPlugin": {
        "Category": "Input",
        "Description": "Enable KWin game controller input detection",
        "EnabledByDefault": false,     <---------- No habilitado por defecto.
        "License": "GPL",
        "Name": "gamepad"
    },
    "X-KDE-ServiceTypes": ["KWin/Plugin"]
}
```

## Pruebas
- Reconocimiento de controlador al inicio y hot-plugging: probado en sesión de desarrollo, los logs de KWin muestran que el plugin detecta controladores en ambos escenarios, funciona como se esperaba.
- Prevenir sleep/suspend: probado en sesión de desarrollo. Configuré el temporizador de suspensión a 1min, presioné repetidamente A y B de ida y vuelta, y a los 5min no se inició suspensión, funciona como se esperaba.
- Soporte de conectividad USB y Bluetooth: probado en sesión de desarrollo, los logs de KWin muestran que el plugin detecta los controladores en ambos escenarios, funciona como se esperaba.
- Mapeo de controlador a teclado y ratón: probado en sesión de desarrollo, todos los botones están mapeados al teclado y ratón esperados, funciona como se esperaba.
- Retroceso en Grab: probado en sesión de desarrollo. Verificado que el mapeo funciona, inicié la aplicación Steam, verifiqué que el mapeo ya no está habilitado.

Dispositivo de prueba: 8Bitdo Gaming Controller (USB/2.4h/Bluetooth)

#### Qué sigue desde aquí
- Integración en KWin Proper: Comenzar a empujar cambios upstream para que otros prueben.
- Mapear a teclado virtual: Permitir a los usuarios navegar y obtener entrada de un teclado virtual. Podría abrir el camino para iniciar sesión usando solo el controlador de juegos.
- Casos de prueba: Como per mejores prácticas al desarrollar para KWin.
- Integración KCM: Una opción GUI para que los usuarios activen/desactiven el plugin. Base para un remapeo de botones más robusto y definido por el usuario.
- Usar Config para mapeo: Usar un archivo de configuración para mantener registro y leer de todos los mapeos de botón a teclado/botón de ratón.

#### Documentación de referencia:
- Plugin de ejemplo / tutorial de KWin: https://invent.kde.org/plasma/kwin/-/tree/master/examples/plugin
- Plugin de capturas de pantalla de KWin: https://invent.kde.org/plasma/kwin/-/tree/33262fef1a6e4e3bcebc05181edbde2d9a72f38c/src/plugins/screenshot
- Backend DRM: https://invent.kde.org/yorisoft/kwin/-/tree/master/src/backends/drm/drm_backend.cpp
- Subsistema de entrada de Linux (overview): https://www.kernel.org/doc/html/latest/input/index.html
- Biblioteca Libevdev: https://www.freedesktop.org/software/libevdev/doc/latest/
- Biblioteca Udev: https://man7.org/linux/man-pages/man7/udev.7.html
- Biblioteca Inotify: https://man7.org/linux/man-pages/man7/inotify.7.html

Revisa el código fuente aquí:
Plugin de KWin Gamepad: https://invent.kde.org/yorisoft/kwin/-/tree/work/yorisoft/gamepad-plugin/src/plugins/gamepad
