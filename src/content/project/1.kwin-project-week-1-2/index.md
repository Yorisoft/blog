---
title: "GSoC'25 Kwin Project Blog Post: Week 1-2"
authors:
  -  yorisoft
date: 2025-06-24
description: project description foo
url: https://foo.co
thumbnail: /images/games.svg
technologies: 
    - cpp
    - java
    - go
    - python 
    - qt
    - cmake
---

These past few week’s my focus was on exploring input device detection and event handling mechanisms in Linux, with a particular emphasis on game controllers and their potential integration into KWin. 
I also spent time reading through KWin’s input-related source code to understand how it currently manages devices, and began reviewing documentation for various Linux input subsystems—including `evdev`, HID, and `/dev/input/jsX` in order to evaluate which layer would provide the most reliable and straight forward support for integrating controller recognition. 
The time was mostly spent learning how to use different libraries, tools and creating virtual controller prototype. 


## Tools, Libraries, and Concepts Used

### libevdev

`libevdev` is a library for handling `evdev` devices. 
It provides a higher-level interface over `/dev/input/event*` and abstracts much of the complexity of input event parsing.
> `evdev` is the generic input event interface. This is the preferred interface for userspace to consume user input, and all clients are encouraged to use it. 
> 
> -The kernel development community.

`libevdev` can be used to:
- Detect physical game controllers.
- Read input events (e.g., joystick, buttons).
- Create virtual input device and write/forward events to it from physical game controller.

### Useful functions:
- `libevdev_new()`, `libevdev_set_fd(int fd, struct libevdev **dev)`: for opening physical devices.
- `libevdev_next_event(struct libevdev *dev, unsigned int flags, struct input_event *ev)`: for polling events.
- `libevdev_get_id_*(const struct libevdev *dev)`: to query device meta data.

### uinput (User Input Subsystem)
I used the Linux **uinput** subsystem to create a **virtual input device** that mirrors a physical controller input. 
**uinput** is what allows us to make a virtual controller out of any evdev device by:
- Opening a file discriptor for the input device that will be emulate (i.e. have it input event forwarded).
- Forwarding the inputs from a `evdev` interface device to `/dev/uinput` (or `/dev/input/uinput`). 
- **uinput** then creates a new node to expose the virtual device as a `evdev` interface device in `/dev/input/event*`

From here the idea is that KWin or any other system component can treat the virtual controller as if it were an ordinary HID device.

> uinput is a kernel module that makes it possible to emulate input devices from userspace.
> By writing to /dev/uinput (or /dev/input/uinput) device, a process can create a virtual input device with specific capabilities. 
> Once this virtual device is created, the process can send events through it, that will be delivered to userspace and in-kernel consumers.
> 
> -The kernel development community.

### Useful functions:
- `libevdev_uinput_create_from_device(const struct libevdev *dev, int uinput_fd, struct libevdev_uinput **uinput_dev)`:  
  For creating a uinput device based on the given libevdev device. 
- `libevdev_uinput_get_devnode (struct libevdev_uinput *uinput_dev)`:  
 	Return the device node representing this uinput device. 
- `libevdev_uinput_write_event (const struct libevdev_uinput *uinput_dev, unsigned int type, unsigned int code, int value)`:
 	Post an event through the uinput device.
  
  
Tools used:
- `libevdev-uinput.h` for management of `uinput` devices via `libevdev`.
- `/dev/uinput` opened with correct permissions.
    - Ensuring the current user is in the `input` group.
    - Verifying that the `uinput` kernel module is loaded (using `modprobe uinput`). Some distros (Ubuntu/Kubuntu) have it built in, not loaded as module, thus `modprobe uinput` command won't log anything.
    - Opening `/dev/uinput` with `O_WRONLY | O_NONBLOCK` flags using `open()`, and ensuring no `EPERM` or `EACCES` errors were returned.
    - Optional: Run program as sudo user.

### force feedback detection/support

Using `ioctl(fd, EVIOCGBIT(EV_FF, ...))` and tools like `fftest`, I examined:

- How to query a device’s force feedback (FF) capabilities to figure out which effects are supported (e.g., rumble, sine wave).
- How to upload ff effects to physical game controller and test rumble motors.
    - This was key to understanding haptic capability support on physical devices. 

> To enable force feedback, you have to:
> 
> have your kernel configured with evdev and a driver that supports your device.
> 
> make sure evdev module is loaded and /dev/input/event* device files are created.


### Testing & Validation
- Used `evtest` and `fftest`to test evdev devices and understand their capabilities - 
 `sudo evtest /dev/input/eventX`.
- Used those same tools to test virtual devices creating using uinput -  
`sudo fftest dev/input/eventX`. uinput creates a node device in `dev/input/eventX` for the virtual input.
- Prototype logs validate that a virtual device can be created and events can properly be written to a that virtual device using `libevdev`.

---

### **Takeaways**

- Using `libevdev` and `libevdev-uinput` we can access physical controllers, create virtual controller and read/write low-level input events.
- Understanding of the permission requirements to open `/dev/input/*` and `/dev/uinput` (use `udev` rules or run as root).
- Tools to test:
    - `evtest` and `fftest` (from `input-utils`)
    - `udevadm info --name=/dev/input/eventX --attribute-walk`
        - Shows the device hierarchy - how the device is connected to PC and any parent device it connects to.
- Built a minimal proof-of-concept C++ program that routes an evdev devices input 1:1 to a virtual controller (via uinput).
- Not all controllers support all force feedback types; some failed with `EINVAL` during upload.
- `libevdev` does not handle FF upload directly — this remains kernel-level and typically involves `ioctl()`.


### References and Documentation
- **[Linux Input Subsystem Documentation](https://www.kernel.org/doc/html/latest/input/index.html) (kernel-level overview of evdev, HID, uinput, etc.)**
- **[evdev interface documentation](https://www.kernel.org/doc/html/latest/input/event.html) (from the kernel source)**
- **[uinput](https://www.kernel.org/doc/html/latest/input/uinput.html): User-level input device emulation**
- **[Force Feedback programming on Linux](https://www.kernel.org/doc/html/latest/input/ff.html) (FF effect types and ioctl usage)**
- **[libevdev](https://www.freedesktop.org/software/libevdev/doc/latest/) (Userspace abstraction for evdev devices)**
