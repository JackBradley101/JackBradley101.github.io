---
layout: post
title: "Robot Summer 2025: Pet Rescue Bot"
date: 2025-08-15
tags: [Robotics, 3D-Printing, Computer-Vision, ENPH-253]
image: /images/ROBOT/FinishedRobotTopView.JPEG
---

Seven-week autonomous robot project featuring a 3D-printed chassis, custom R–Z–θ arm, and YOLOv11 vision system. Built entirely from scratch by a team of four for UBC's Robot Summer competition. Iteration speed through additive manufacturing was the key advantage.

<!--more-->

This summer I spent seven weeks in ENPH 253 (Robot Summer), a project-based course where teams of four build an autonomous robot from scratch for a themed competition. The 2025 theme was **"Pet Rescue"**: navigate a cluttered course, find plush animals, and get them to safety as fast and reliably as possible.

Teams typically put in **50–70 hours a week**, and the final public competition is the exam.

![Finished robot top view](/images/ROBOT/FinishedRobotTopView.JPEG)
*Final robot with R–Z–θ arm and vision system*

Our team focused on two ideas:

* Use **3D printing for most large structures** to maximize iteration and minimize time spent machining  
* Build an **R–Z–θ arm** that could reach quickly and reliably across a large workspace

---

## Design Philosophy: When in doubt, print it out

Most teams spent a large amount of time machining. I tried to turn as much of that time into testing:

* Complex parts (like our sub-chassis) were **3D printed**  
* Anything not printed was **laser cut** or **waterjet cut**  
* We never touched a mill or lathe during the whole course

This meant that if I wanted to try a new chassis idea, I could:

* Make the change in SolidWorks in the afternoon  
* Start a print before leaving  
* Show up the next morning to a **new sub-chassis** ready to assemble

That iteration speed let us spend our energy on:

* Iterating geometry for stiffness, mounting points, and clearances  
* Simplifying assembly and maintenance  
* Making room for wiring and sensors

![3D printed robot chassis](/images/ROBOT/3DPrintedRobotChassis.JPEG)
*3D-printed sub-chassis with integrated mounting points*

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ROBOT/FinishedRobotSide.JPEG" alt="Finished robot side view" style="width: 48%; min-width: 280px;">
  <img src="/images/ROBOT/FinishedRobotTopView.JPEG" alt="Finished robot top view" style="width: 48%; min-width: 280px;">
</div>

*Left: Side view showing arm clearance. Right: Top view with electronics layout*

The final robot felt solid, but we reached that point with far more design iterations than if everything had been aluminum.

---

## The Arm: R–Z–θ on a Student Budget

My favorite part of the robot was the arm. The goal was a fast, robust manipulator that could sweep a wide area and grab plushies without needing perfect approach.

### Mechanism

The arm used an **R–Z–θ** layout:

* **θ axis** at the base for rotation  
* **Z axis** for vertical motion  
* **R axis** for radial extension  

Mechanically:

* Two axes were **belt driven** by **stepper motors**  
* One axis used a **rack and pinion**  
* Linear rails, steppers, and belts came from a low-cost supplier in China

The long lead time was worth it. We ended up with high quality rails and motors for very little money.

I also scavenged and reused parts:

* A bearing for the θ base from a **scrap bin at Zaber**  
* One stepper from my team lead at Zaber (shoutout to James)

All wiring on the arm was bundled in **nylon cover**:

* Less chance of snagging on the moving arm  
* Easier inspection and repair  

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ROBOT/RobotArmV1.JPEG" alt="Robot arm version 1" style="width: 48%; min-width: 280px;">
  <img src="/images/ROBOT/RobotArmV2.JPEG" alt="Robot arm version 2" style="width: 48%; min-width: 280px;">
</div>

*Left: Early arm prototype. Right: Final arm design with cable management*

### Control

On the control side:

* High level strategy and perception ran on a **Raspberry Pi**  
* Low level motion control and line following ran on an **ESP32**  
* The two boards communicated over **UART**

The arm used **stepper motors with acceleration profiles**:

* Python GPIO controlled motion profiles  
* Smooth acceleration to avoid skipped steps  
* Basic interlocks to prevent hitting hard limits

---

## Vision and Strategy

Perception was one of the hardest parts of the competition.

We used:

* A **YOLOv11** model on the Raspberry Pi with an SSD  
* A dataset of roughly **4,000 labeled images** of the plushies  
* A **PD controller** on the Pi that used the plushie's position in the frame to align the robot for grabbing (sub-one second homing)

The high level behavior looked like:

1. Line follow and navigate until plushies appear in view  
2. Use YOLO to detect a plushie and compute a target  
3. Use PD alignment to position the arm  
4. Command the arm to reach and grab  
5. Place plushie in the basket and continue to the safe zone

This stack combined computer vision, real time control, and coordination between two processors.

---

## Why 3D Printing Was a Key Differentiator

From an engineering point of view, one of our biggest wins was **iteration speed** enabled by 3D printing:

* Major structural changes to the chassis or arm mounts took hours in CAD, not days in the shop  
* Overnight prints meant every day started with a new version to test  
* Laser cutting and waterjet use were reserved for parts where stiffness or precision really mattered  

Instead of sinking time into machining, we invested in:

* Strategy and control  
* Tuning arm motion and robustness  
* Improving serviceability and cable routing  
* Tweaking perception and behavior  

Robot Summer is already intense. Treating 3D printing as the default for complex structures allowed us to push a more ambitious design without getting buried in the machine shop.

---

## Takeaways

A few key lessons from this project:

* **Design for iteration, not perfection.** If you can reprint a chassis overnight, you can explore more aggressive concepts.  
* **Good motion hardware is worth the sourcing effort.** Affordable but decent rails and steppers were a huge step up from random scavenged parts.  
* **Cable management helps.** Clean routing and nylon cover prevented a lot of avoidable failures.  
* **Specialization between processors is powerful.** High level perception and strategy on the Pi, with deterministic low level control on the ESP32, worked very well.

Robot Summer compresses a huge amount of learning into a short time. This robot, especially the arm and printed chassis, was a great demonstration of what you can build in a few weeks if you treat iteration speed as a core design constraint.
