---
title: "GSoC'25 KWin Project Blog Post: Week 3-4"
discourse: yorisoft
authors:
  -  yorisoft
date: 2025-09-15
description: project description foo
url: https://foo.co
thumbnail: /images/kwin_plugin_gamepad_architecture_diagram_3.png
technologies: 
    - cpp
    - java
    - go
    - python 
    - qt
    - cmake
---

# KWin::Plugin::GamePadManager

Picking up from weeks 1+2 ( research + prototypes with libevdev/uinput ), these two past weeks were about moving from “research-only mode” to turning ideas into programming logic that lives inside KWin to: detect gaming controllers and their input events, keeps Plasma awake on controller activity, handles hot-plug and pre-existing connections on startup, and lays down the first mappings from controller input to keyboard/mouse actions without stepping on other apps utilizing the controllers.

From the start my mentors and I have had a general idea of the features we wanted to add but weren't too sure how to implement them. After some thinking and experimenting they advised me to start off with a KWin::Plugin. This would allow us to start introducing the gaming controller functionalities to KWin while avoiding having to edit the core or guts of KWin. It would also be a great entry point for current and future game controller input objectives, allowing us to start small with a 1st party KWin plugin, build on it, and possibly integrate it into core functionality. 

When it comes to creating KWin plugins I had a few options:
- Scripts: Written in QML/JavaScript and used for automating window management, tiling, shortcuts, etc.
- Effects: Implement visual effects on windows, the desktop, or transitions.
- Core/Native: These are built into KWin itself and extend KWin’s internal functionality.

Since the plugin needs low-level device access, such as monitoring `/dev/input/event*`, listening to `udev` hotplugs, opening fds, and reacting to `evdev` events the best choice was to go with Core / Native plugin. As opposed to Effect and Script plugins which aren’t designed to open devices or do long-running I/O, most simply just live inside the rendering/scripting layers. 


I started off by searching for an example of how to build a KWin plugin so I could start learning how to build my own. Thankfully my mentor @zamundaaa provided me with some great examples:
- Example / Tutorial plugin located in `src/plugin/examples/plugin`
- Screenshots plugin located in `src/plugins`

Between both of these examples and mentoring I was able to piece together the scaffolding ( essential parts ) of a KWin plugin and was able to put together the first version of this plugin, `gamepad` plugin, located in: `kwin/src/plugins/gamepad`. At this point the plugin is structured as follows: 
```
main.cpp                // Entry point & Defines GamepadManagerFactory Class
metadata.json           // Declares the plugin to KWin, define information about plugin
CMakeLists.txt          // C++ Build/Installation/Logging wiring
gamepadManager.{cpp/h}  // Plugin Logic: Defines GamepadManager Class
gamepad.{cpp/h}         // Game Controller Object: Wrapper Class for Physical Controller
```

## Implementation notes  

### GamepadManagerFactory  
`GamepadManagerFactory` Class serves simply as the entry point for the plugin. It's a factory class, or a class used to create other classes / object types. Like the examples, it inherits from `PluginFactory` and declares it as its interface as well as pointing to the `metadata.json` file for this plugin. It initializes the plugin through its `create()` function which returns a `GamepadManager`.  
  
  
### GamepadManager  
`GamepadManager` class serves as the central coordinator (the “brain” or “hub”) of the entire project. While creating this I took a lot of inspiration from `src/backend/drm/drm_backend.{cpp/h}`, which itself is responsible for handling drm/gpu devices. `GamepadManager` covers many responsibilities. It owns and manages all gamepad devices, handles discovery (startup enumeration, hot-plug), lifecycle (adding/removing), and communication (signals when pads are added/removed, or when their state changes). Overall its responsible for keeping track of the current set of controllers and their status. 

#### Detect hot-plug and pre-existing device detection:
For this part many of the DRM backend pattern were used. The first thing the manager class does on initialization is create two `QMetaObject::Connection`s that monitor the current KWin session for `devicePaused` and `deviceResumed` signals. This helps **track devices when Plasma goes in and out of sleep/suspend** which causes devices to be Paused and Resumed. It then enumerates over all event devices located in `/dev/input/event*` to **handle any pre-existing connections to game controllers**. If it discovers an event device it adds the gamepad ( start tracking it and its input ).  
```cpp
// On init:
// Enumerate current input nodes to filter and add ONLY event nodes
QDir dir(QStringLiteral("/dev/input"));
const auto files = dir.entryList({QStringLiteral("event*")}, QDir::Files | QDir::Readable | QDir::System);
for (const QString &file : files) {
    const QString path = dir.absoluteFilePath(file);
    if (!isTracked(path)) {
        addGamepad(path);
    }
}
```
  
  
  
Finally using `udev` it monitors the subsystems and filter for only "input" subsystem events. It uses `QSocketNotifier` to produce signal notifications from `udev` events and creates a connections between that notifier and a memeber function, `handleUdevEvent`, that handles events coming from the `udev` monitor when an input device is detecetd. Some checks are performed to verify if the device is a gaming controller, such as expected input events and input event types. This include input events like `BTN_JOYSTICK` and `BTN_GAMEPAD`, which are commonly defined in gaming controllers. As well as checking for joystick or D-pad capabilities. If the checks pass the game controller is "added", or in other words, the device is wrapped in a `Gamepad` class, kept track of and its presence monitored.
```cpp
// setup udevMonitor
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
`Gamepad` is a wrapper class. It's purpose is to be tied to a physical controller. One `Gamepad` object per physical game controller. This enables quick access/reference to the device and allows for the physical controller to be treated like an object. This class is also responsible for device input handling, Plasma Idle refresh, and button to keyboard/mouse mappings. In the future things might get split up into seperate files but as it is, it handles a lot. As with the `GamepadManager`, this class takes a lot of inspiration from DRM backend patterns. 

#### Detect Input Events:
Once a gaming controller device is detected it gets wrapped in a `Gamepad` class object. Which in turn wraps the controller in a `libevdev` object pointer.  This is the part that gives access to the controller through the `libevdev` API, making it easier to work with it and monitor its input events. Like `GamepadManager` the first thing this class does is use `QSocketNotifier` to produce notifications from the controllers `fd`, i.e monitor for input. It then creates a connections between that notifier and a member function, `handleEvdevEvent`, which **handles all incoming input events from that device**.
```cpp
libevdev *evdev = createEvDevice();
if (evdev) {
    m_evdev.reset(evdev);

    m_notifier = std::make_unique<QSocketNotifier>(m_fd, QSocketNotifier::Read, this);
    connect(m_notifier.get(), &QSocketNotifier::activated, this, &Gamepad::handleEvdevEvent);

    qCDebug(KWIN_GAMEPAD) << "Connected to Gamepad ( new libevdev* ): " << libevdev_get_name(m_evdev.get()) << "at" << m_path;
}
```  
  
  
#### Plasma Idle Refresh On Controller Activity  
With the ability to monitor for all input events from the device, the plugin then uses that information to know when to reset Plasma idle timer. For this `Gamepad` imports/includes `input.h` file and makes a call to `input()->simulateUserActivity()` when an input event is detected from the controller. This causes Plasma idle timer to be reset and **prevents the system from going into sleep/suspend mode while using only gaming controller**.  
```cpp
// reset idle time
input()->simulateUserActivity();
```  

  
#### Controller -> Keyboard & Mouse Mapping
`Gamepad` uses API function from `libevdev` to check for input events, identify the specific input event and map that to a keyboard or mouse input event. Using `libevdev_next_event()` it checks for the input event coming from that game controller. It then identifies the specific input event through its input event `type`, `code`, and `value`. To simulate a mouse and keyboard the `core/inputdevice.h` file is imported and used to declare `GenericInputDevice` which inherits from `InputDevice`. That `GenericInputDevice` effectively behaves like a virtual keyboard and mouse inside KWin’s input stack.  

When specific `libevdev` input event are identified, such as `EV_KEY` + `BTN_SOUTH` ( A button press ) OR `EV_KEY` + `BTN_EAST` ( B button press ), it  call `InputDevice::sendKey()` to **simulate keyboard key press and inject the desired keys into KWin input pipeline**. In this case `Enter` for A ( `BTN_SOUTH` ) and `Escape` for B ( `BTN_EAST` ). To emulate mouse/pointer the plugin makes calls to `InputDevice::sendPointerButton()` for left and right mouse buttons, and `InputDevice::sendPointerMotionDelta()` for pointer movement.  

![architecture_diagram_0](/images/kwin_plugin_gamepad_architecture_diagram_0.png) 
![architecture_diagram_1](/images/kwin_plugin_gamepad_architecture_diagram_1.png) 
![architecture_diagram_2](/images/kwin_plugin_gamepad_architecture_diagram_2.png) 
![architecture_diagram_3](/images/kwin_plugin_gamepad_architecture_diagram_3.png) 

Here is a list of all the buttons to keyboard/mouse mappings:  
```
Face Buttons
------------
BTN_SOUTH  → Enter (Qt::Key_Return)
BTN_EAST   → Escape (Qt::Key_Escape)
BTN_NORTH
BTN_WEST

Bumpers
-------
BTN_TL     → Alt (Qt::Key_Alt)
BTN_TR     → Tab (Qt::Key_Tab)

Trigger Buttons
---------------
ABS_Z      → Mouse Left Click
ABS_RZ     → Mouse Right Click

D-Pad
-----
BTN_DPAD_LEFT   → Arrow Left  (Qt::Key_Left)
BTN_DPAD_RIGHT  → Arrow Right (Qt::Key_Right)
BTN_DPAD_UP     → Arrow Up    (Qt::Key_Up)
BTN_DPAD_DOWN   → Arrow Down  (Qt::Key_Down)

Analog Sticks
-------------
ABS_RX / ABS_RY → Pointer Motion

Center Buttons
--------------
BTN_SELECT → Show On-Screen Keyboard ( WIP )
BTN_START  → Meta/Super (Qt::Key_Meta)

```

#### Prevent Stepping On Other Apps
It's essential that the plugin doesn't emulate keyboard and mouse for the gaming controller when another app is reading from it. Most likely in such cases the device is being used for something else and not being used to navigate the desktop. To achieve this the `GamepadManager` class creates an instance of `inotify` object, and adds a `watch device` to the `fd` of each game controller that’s added as a `Gamepad`. Whenever `inotify` produces a notification a function, `GamepadManager::handleFdAccess`, is called which increments a counter in `Gamepad`,  `Gamepad::m_usageCount` by +1 if the event value is `IN_OPEN` or `Gamepad::m_usageCount` by -1 if the event value is `IN_CLOSE_WRITE | IN_CLOSE_NOWRITE`. The plugin will only attempt to emualte keyboard/mouse if `m_usageCount` is 0. This **prevents emulation of keyboard and mouse when other apps have the game controller opened / in use**.
```cpp
// Process all inotify events in the buffer
for (char *ptr = buffer; ptr < buffer + length;) {
    struct inotify_event *event = reinterpret_cast<struct inotify_event *>(ptr);

    auto it = m_watchesToGamepads.find(event->wd);
    if (it != m_watchesToGamepads.end()) {
        Gamepad *pad = it.value();
        if (event->mask & IN_OPEN) {
            pad->countUsage(+1);
        } else if (event->mask & (IN_CLOSE_WRITE | IN_CLOSE_NOWRITE)) {
            pad->countUsage(-1);
        }
        qCDebug(KWIN_GAMEPAD) << "Device" << pad->path() << "in use by:" << pad->usageCount() << " other apps";
    }
    ptr += sizeof(struct inotify_event) + event->len;
}
```  
  
  
#### Opt-In
Many of the native plugins that ship with KWin are enabled by default but for our gaming controller plugin we will disable it by default and make it an opt-in option. This will allow users to start experimenting and benefiting from the plugin without risking the possibility of breaking current game controller input on their system.
```json
{
    "KPlugin": {
        "Category": "Input",
        "Description": "Enable KWin game controller input detection",
        "EnabledByDefault": false,     <---------- Not enabled by default. 
        "License": "GPL",
        "Name": "gamepad"
    },
    "X-KDE-ServiceTypes": ["KWin/Plugin"]
}
```
   
  
   
## Testing
- Controller awareness at startup and hot-plugging: tested in development session, KWin logs show the plugin picking up controllers in both scenarios, works as expected. 
- Preventing sleep/suspend: tested in development session. Set suspend timer to 1min, repeatedly press A and B back and forth, and at 5min no suspend was initiated, works as expected.  
- USB and Bluetooth connectivity support: tested in development session, KWin logs show plugin picking up on the controllers in both scenarios, works as expected. 
- Mapping from controller to keyboard and mouse: tested in development session, all buttons are map to expected keyboard and mouse, works as expected. 
- Backoff On Grab: tested in development session. Verified mapping work, started Steam app, verify mapping no longer enabled. 

Testing device: 8Bitdo Gaming Controller (USB/2.4h/Bluetooth)
  
   
   
#### What’s next from here
- Integration into KWin Proper: Start pushing changes upstream for others to test.
- Map to Virtual Keyboard: Allow users to navigate over and get input from a virtual keyboard. Might open the way for logging in using only game controller.  
- Test Cases: As per best practices when developing for KWin.
- KCM integration: A GUI option for users to toggle plugin ON/OFF. Ground work for more robust, user defined, button remapping. 
- Use Config for Mapping: Using a config file to keep track of and read from all the button to keyboard/mouse button mapping. 


#### Reference documentation:
- Example / Tutorial KWin Plugin: https://invent.kde.org/plasma/kwin/-/tree/master/examples/plugin
- Screenshots KWin Plugin: https://invent.kde.org/plasma/kwin/-/tree/33262fef1a6e4e3bcebc05181edbde2d9a72f38c/src/plugins/screenshot
- DRM Backend: https://invent.kde.org/yorisoft/kwin/-/tree/master/src/backends/drm/drm_backend.cpp
- Linux Input Subsystem (overview): https://www.kernel.org/doc/html/latest/input/index.html
- Libevdev Library: https://www.freedesktop.org/software/libevdev/doc/latest/
- Udev Library: https://man7.org/linux/man-pages/man7/udev.7.html
- Inotify Library: https://man7.org/linux/man-pages/man7/inotify.7.html

Checkout the source code here:
KWin Gamepad Plugin: https://invent.kde.org/yorisoft/kwin/-/tree/work/yorisoft/gamepad-plugin/src/plugins/gamepad
