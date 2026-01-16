---
title: "GSoC'25 Blog del Proyecto KWin: Semanas 1-2"
authors:
  -  yorisoft
date: 2025-06-24
SPDX-License-Identifier: CC-BY-SA-4.0
SPDX-FileCopyrightText: 2025 Yelsin Sepulveda <yelsin.sepulveda@kdemail.net>
---

Durante estas últimas semanas, me he enfocado en explorar los mecanismos de detección de dispositivos de entrada y manejo de eventos en Linux, con un énfasis particular en los controladores de videojuegos y su posible integración en KWin.  
También dediqué tiempo a leer el código fuente relacionado con la entrada de KWin para entender cómo gestiona actualmente los dispositivos, y comencé a revisar documentación de varios subsistemas de entrada de Linux — incluyendo `evdev`, HID y `/dev/input/jsX` — con el objetivo de evaluar qué capa ofrece el soporte más confiable y directo para integrar el reconocimiento de controladores.  
La mayor parte del tiempo se dedicó a aprender a usar diferentes bibliotecas, herramientas y a crear un prototipo de controlador virtual.


## Herramientas, Bibliotecas y Conceptos Utilizados

### libevdev

`libevdev` es una biblioteca para manejar dispositivos `evdev`.  
Proporciona una interfaz de más alto nivel sobre `/dev/input/event*` y abstrae gran parte de la complejidad del análisis de eventos de entrada.

> `evdev` es la interfaz genérica de eventos de entrada. Esta es la interfaz preferida para que el espacio de usuario consuma entradas de usuario, y se recomienda a todos los clientes usarla.  
> — Comunidad de desarrollo del kernel de Linux.

`libevdev` puede usarse para:  
- Detectar controladores físicos.  
- Leer eventos de entrada (por ejemplo, joystick, botones).  
- Crear un dispositivo de entrada virtual y escribir o reenviar eventos desde un controlador físico.

### Funciones útiles:
- `libevdev_new()`, `libevdev_set_fd(int fd, struct libevdev **dev)`: para abrir dispositivos físicos.  
- `libevdev_next_event(struct libevdev *dev, unsigned int flags, struct input_event *ev)`: para leer eventos.  
- `libevdev_get_id_*(const struct libevdev *dev)`: para consultar metadatos del dispositivo.


### uinput (Subsistema de Entrada de Usuario)

Utilicé el subsistema **uinput** de Linux para crear un **dispositivo de entrada virtual** que refleje la entrada de un controlador físico.  
**uinput** permite crear un controlador virtual a partir de cualquier dispositivo `evdev` al:

- Abrir un descriptor de archivo para el dispositivo de entrada que se va a emular (es decir, reenviar eventos de entrada).  
- Reenviar las entradas desde un dispositivo `evdev` hacia `/dev/uinput` (o `/dev/input/uinput`).  
- **uinput** luego crea un nuevo nodo que expone el dispositivo virtual como un dispositivo de tipo `evdev` en `/dev/input/event*`.

La idea es que KWin o cualquier otro componente del sistema pueda tratar al controlador virtual como si fuera un dispositivo HID ordinario.

> uinput es un módulo del kernel que permite emular dispositivos de entrada desde el espacio de usuario.  
> Al escribir en el dispositivo `/dev/uinput` (o `/dev/input/uinput`), un proceso puede crear un dispositivo de entrada virtual con capacidades específicas.  
> Una vez creado, se pueden enviar eventos a través de él, los cuales serán entregados tanto al espacio de usuario como a consumidores internos del kernel.  
> – Comunidad de desarrollo del kernel.

### Funciones útiles:
- `libevdev_uinput_create_from_device(const struct libevdev *dev, int uinput_fd, struct libevdev_uinput **uinput_dev)`:  
  para crear un dispositivo `uinput` basado en un dispositivo `libevdev`.  
- `libevdev_uinput_get_devnode(struct libevdev_uinput *uinput_dev)`:  
  devuelve el nodo del dispositivo que representa el dispositivo `uinput`.  
- `libevdev_uinput_write_event(const struct libevdev_uinput *uinput_dev, unsigned int type, unsigned int code, int value)`:  
  envía un evento a través del dispositivo `uinput`.


### Herramientas utilizadas:
- `libevdev-uinput.h` para la gestión de dispositivos `uinput` vía `libevdev`.  
- Acceso a `/dev/uinput` con permisos adecuados:  
  - Verificar que el usuario esté en el grupo `input`.  
  - Confirmar que el módulo `uinput` del kernel esté cargado (usando `modprobe uinput`). En algunas distribuciones (como Ubuntu/Kubuntu) puede estar integrado pero no cargado como módulo y no generar mensajes en los logs.  
  - Abrir `/dev/uinput` con los flags `O_WRONLY | O_NONBLOCK` usando `open()` y asegurarse de que no se devuelvan errores `EPERM` o `EACCES`.


### Detección y soporte de retroalimentación háptica (force feedback)

Usando `ioctl(fd, EVIOCGBIT(EV_FF, ...))` y herramientas como `fftest`, examiné:

- Cómo consultar las capacidades de retroalimentación háptica (FF) de un dispositivo, para saber qué efectos soporta (por ejemplo, vibración, onda senoidal).  
- Cómo subir efectos de FF al controlador físico y probar los motores de vibración.  
  - Esto fue clave para entender el soporte de capacidades hápticas en dispositivos físicos.

> Para habilitar la retroalimentación háptica (force feedback), debes:  
> Tener el kernel configurado con `evdev` y un driver que soporte tu dispositivo.  
> Asegurarte de que el módulo `evdev` esté cargado y que los archivos `/dev/input/event*` estén creados.


### Pruebas y Validación

- Usé `evtest` y `fftest` para probar dispositivos `evdev` y entender sus capacidades:  
  `sudo evtest /dev/input/eventX`.  
- Usé esas mismas herramientas para probar los dispositivos virtuales creados con `uinput`:  
  `sudo fftest /dev/input/eventX`. `uinput` crea un nodo tipo `eventX` en `/dev/input/`.  
- Los registros del prototipo validan que un dispositivo virtual puede ser creado y que los eventos pueden escribirse correctamente en él usando `libevdev`.


### **Conclusiones**

- Con `libevdev` y `libevdev-uinput` podemos acceder a controladores físicos, crear controladores virtuales y leer/escribir eventos de entrada de bajo nivel.  
- Comprendí los requisitos de permisos para abrir `/dev/input/*` y `/dev/uinput` (usando reglas `udev` o ejecutando como root).  
- Herramientas útiles para pruebas:  
  - `evtest` y `fftest` (del paquete `input-utils`).  
  - `udevadm info --name=/dev/input/eventX --attribute-walk`: muestra la jerarquía del dispositivo — cómo está conectado al PC y qué dispositivos padre tiene.  
- Construí un programa de prueba en C++ que reenvía la entrada de un dispositivo `evdev` 1:1 a un controlador virtual (usando `uinput`).  
- No todos los controladores soportan todos los tipos de retroalimentación; algunos fallan con `EINVAL` al subir efectos.  
- `libevdev` no gestiona directamente la subida de efectos FF — esto se mantiene a nivel del kernel y típicamente involucra `ioctl()`.


### Referencias y Documentación

- [Documentación del subsistema de entrada de Linux](https://www.kernel.org/doc/html/latest/input/index.html) (visión general a nivel del kernel sobre `evdev`, `HID`, `uinput`, etc.)  
- [Documentación de la interfaz evdev](https://www.kernel.org/doc/html/latest/input/event.html) (desde el código fuente del kernel)  
- [uinput](https://www.kernel.org/doc/html/latest/input/uinput.html): Emulación de dispositivos de entrada desde el espacio de usuario  
- [Programación de retroalimentación háptica en Linux](https://www.kernel.org/doc/html/latest/input/ff.html) (tipos de efectos FF y uso de `ioctl`)  
- [libevdev](https://www.freedesktop.org/software/libevdev/doc/latest/) (abstracción en espacio de usuario para dispositivos `evdev`)
