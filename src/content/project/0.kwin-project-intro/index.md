---
title: GSoC 2025 Project Blog Intro - Improving Game Controller Support in KWin
authors:
  -  yorisoft
date: 2025-05-12
description: project description - foo
url: https://foo.co
thumbnail: https://foo.png
technologies: 
    - cpp
    - java
    - go
    - python 
    - qt
    - cmake
---

# Hello KDE Community! 

My name is Yelsin ['yorisoft'](https://invent.kde.org/yorisoft) Sepulveda. I'm an engineer with experience in DevOps, and Cloud Computing. I joined KDE as part of the GSoC application process early last month and have been contributing to a few projects ever since. Miraculously, my GSoC proposal has been selected! ❤️ *Hallelujah!* Which means over this summer **I'll be working on implementing game controller input recognition into KWin.**

## About the Project

Currently, applications directly manage controller input, leading to inconsistencies, the inability of the system to recognize controller input for power management, and unintentionally enabling/disabling "lizard mode" in certain controllers. This project proposes a solution to unify game controller input within KWin by capturing controller events, creating a virtual controller emulation layer, and ensuring proper routing of input to applications. This project aims to address the following issues:
- **System Power Management**: KWin lacks controller input recognition, preventing activity reporting and causing premature system sleep.
- **"Lizard Mode"**: When KWin opens a file descriptor for certain gaming controller devices (like the Steam Controller and Steam Deck Controller), this disables those controllers' lizard mode (keyboard and mouse input emulation), since the controller detects that a program is now handling input?even if KWin isn't actively using it.
- **Decentralized Input Handling**: Individual application input handling results in inconsistent input parsing and limited remapping capabilities.

## Project Goals

The primary goals of this project are to:
- Enable KWin to capture and process game controller input events.
- Implement a virtual controller emulation layer within KWin.
- Route physical controller input 1:1 to emulated devices, including haptics.
- Prevent system sleep during active controller use.
- Manage "lizard mode" for compatible controllers.
- Establish a foundation for future features: global remapping, haptics settings, and advanced Wayland protocols.

## About Me

I often spend my time surfing the internet learning new things, spending quality time with family and friends, or picking up new hobbies and skills-such as music! You could say I'm someone who likes to jump between multiple hobbies and interests. As of late, I'm learning a new [snare solo](https://youtu.be/q887A3B0tZQ?si=WNsSR2d4Me2TTU3o) and how to build an online brand.

I started my career as a DevOps Engineer and SRE where I learned tools like Jenkins, Docker, and Terraform. I then transitioned to a Solutions Architect role where I worked with many different cloud technologies and helped other companies design their cloud architecture. I am relatively new to contributing to open-source projects but have been an avid user of Linux and open-source tools for over 4 years, and am committed to learning and growing in this community. Check me out on [GitHub](https://github.com/Yorisoft).
