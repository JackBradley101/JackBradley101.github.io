---
layout: post
title: "Using Stages to Make More Stages at Zaber Technologies"
date: 2025-11-13
tags: [Zaber, Automation, Manufacturing, Computer-Vision, Python]
image: /images/ZABER/NozzleAndStageFinishedPhoto.JPEG
---

Custom peristaltic pump system for automated cyanoacrylate dispensing with non-contact tube sensing, Python state machine control, and computer vision verification. Designed and built during a co-op at Zaber Technologies to improve consistency and speed in production assembly.

<!--more-->

During my 4-month co-op at Zaber I owned an effort to automate cyanoacrylate dispensing on a magnet pick-and-place line. The project involved **mechanism design**, **non-contact sensing**, **state-machine control**, and a **CV proof-of-concept** for deposit verification.

---

## System Overview

The complete system follows this flow:

1. **Pickup tube** submerged in CA reservoir
2. **First sensor** detects fluid level and bubbles before the pump (critical because air in the pump kills consistency)
3. **Peristaltic pump** drives fluid through PTFE tubing
4. **Bowden tube** routes fluid to the vertical stage
5. **Second sensor** at the nozzle assembly with TPU split clamp
6. **PTFE syringe tip** dispenses onto the part

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ZABER/FinishedPumpAssemblyWithSensor.JPEG" alt="Complete pump assembly with inlet sensor" style="width: 48%; min-width: 280px; object-fit: contain;">
  <img src="/images/ZABER/NozzleAndStageFinishedPhoto.JPEG" alt="Nozzle assembly on vertical stage" style="width: 48%; min-width: 280px; object-fit: contain;">
</div>

*Left: Pump assembly showing inlet sensor, peristaltic pump housing, and tube routing. Right: Nozzle assembly mounted on Z-axis stage with outlet sensor and dispense tip*

<div style="display: flex; justify-content: center; margin: 20px 0;">
  <img src="/images/ZABER/NozzleCrossSection.PNG" alt="Nozzle cross-section" style="width: 40%; min-width: 300px; object-fit: contain;">
</div>

<p style="text-align: center; font-style: italic;">Cross-section showing outlet sensor, TPU split clamp, and PTFE syringe tip support</p>

---

### Things I Accomplished

* Designed a **custom peristaltic pump** and **non-contact tube sensor** that reliably primes, dispenses, and detects bubbles
* Wrote a **Python state machine** with prime/purge/bubble-detect routines and safety interlocks
* Switched production from 2-part epoxy to **cyanoacrylate** after testing—higher strength/heat resistance and no mixing
* Prototyped **computer vision** deposit verification of clear fluid on brushed steel with glare

---

## Peristaltic Pump

Early pumps struggled with tube life and inconsistent dispense volume because **PTFE (needed for CA compatibility)** doesn't rebound like silicone; it pancakes under occlusion. After a lot of prototypes, the final design used **many small metal dowel rollers** spinning on **stacked skateboard bearings**: low friction, gentle on the tube, and fast.

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ZABER/PumpExplodedViewSide.PNG" alt="Pump exploded view" style="width: 32%; min-width: 200px; object-fit: contain;">
  <img src="/images/ZABER/PumpCADFront.PNG" alt="Pump front CAD" style="width: 32%; min-width: 200px; object-fit: contain;">
  <img src="/images/ZABER/PumpRotorCAD.PNG" alt="Pump rotor CAD" style="width: 32%; min-width: 200px; object-fit: contain;">
</div>

*Left to right: Exploded assembly view, front view showing roller arrangement, rotor detail*

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ZABER/PumpRotorMilling.JPEG" alt="Rotor milling operation" style="width: 48%; min-width: 280px; object-fit: contain;">
  <img src="/images/ZABER/softJawsPumpRotor.JPEG" alt="3D-printed soft jaws for rotor" style="width: 48%; min-width: 280px; object-fit: contain;">
</div>

*Left: Rotor being machined. Right: 3D-printed soft jaws holding the rotor for secondary operations*

---

## Non-Contact Tube Sensing (Prime, Flow, Bubbles)

I wanted flow detection **without touching the adhesive**. The trick: a **wide-aperture phototransistor/photointerrupter** aimed through the PTFE tube. When the tube is filled with clear CA, **refraction directs more light into the receiver** than when it's empty. The "filled" case produces a *higher* signal (the opposite of the usual opaque-fluid method). To do this I:

* Printed a **micrometer-adjust test jig** to sweep tube position and find the **max-SNR** spot
* Designed and machined a **6061 sensor housing** so the tube seats repeatably at that sweet spot
* Logged signals during prime to **auto-detect** "no tube," "empty," "filled," and **bubble events**

<div style="display: flex; justify-content: center; margin: 20px 0;">
  <img src="/images/ZABER/EarlyNozzleAssemblyPrototype.JPG" alt="Early sensor prototype" style="width: 50%; min-width: 300px; object-fit: contain;">
</div>

*Early prototype of the sensor housing and optical detection system*

---

## Control: Python State Machine

All machine logic lived in a **Python state machine**:

* **Prime**: drive until sensor goes high, then short purge
* **Purge**: dispense until deadspace between sensor and nozzle opening is filled
* **Bubble detect**: watch for rapid signal oscillations and re-prime automatically
* **Safety**: lockouts for operator interaction, E-stop, and time-at-nozzle

This robust state machine is what allows for unsupervised operation.

---

## Cyanoacrylate > Epoxy

I evaluated adhesives on **lap/shear and peel fixtures** (using yoke samples and jigs I designed), then moved production to **cyanoacrylate (CA)**:

* **No mixing**, clean handling, high strength, and **excellent heat resistance** for our use-case
* CA requires **PTFE tubing** and careful pump design, but the automation benefits were worth it

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ZABER/MagnetShearTestJig.JPEG" alt="Shear test fixture" style="width: 48%; min-width: 280px; object-fit: contain;">
  <img src="/images/ZABER/MoreConsistentGlueDots.JPEG" alt="Consistency testing results" style="width: 48%; min-width: 280px; object-fit: contain;">
</div>

*Left: Shear/peel test fixture for bond strength validation. Right: Testing dispense consistency*

---

## CV Proof-of-Concept:

Clear adhesive on **brushed steel** is near-worst-case: low contrast, specular hot spots. I built a PoC with controlled lighting and OpenCV morphology/contour logic that segmented deposits **well enough for a go/no-go** gate. With more time, I'd move to a shrouded camera with a ring light.

![CV segmentation of deposit](/images/ZABER/DispenseVerificationComputerVision.PNG)
*Proof-of-concept computer vision segmentation for dispense verification on brushed steel*

---

## Impact

* The dispenser moved from prototype to **production on new flagship products**
* Prime/purge reliability and bubble detection reduced rework and operator time
* The CV PoC is queued to push toward **lights-out** dispense verification

<div style="display: flex; justify-content: center; margin: 30px 0;">
  <iframe 
    width="315" 
    height="560" 
    src="https://www.youtube.com/embed/zCVJ1S2KYQU" 
    title="First automated dispense run" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen
    loading="lazy"
    style="border-radius: 8px; max-width: 100%;">
  </iframe>
</div>

---

### A Side Project: Pin-Wrench Bearing Preload Tool

I also designed a **pin-wrench + ID expansion clamp** for preloading bearings. It kept torque on-axis and made setup safer. The 3D-printed covers prevented the steel tool from attracting the large magnet assembly.

![Pin-wrench and ID clamp fixture](/images/ZABER/ZaberJigsWithMagneticShielding.JPEG)
*Pin-wrench tool and fixture assembly for bearing preload operations*

<div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0;">
  <img src="/images/ZABER/KeyMachinedIntoZaberJig.JPEG" alt="Machined steel fixture detail" style="width: 48%; min-width: 280px; object-fit: contain;">
  <img src="/images/ZABER/PocketMachinedIntoIDClamp.JPEG" alt="Recessed pocket in ID clamp" style="width: 48%; min-width: 280px; object-fit: contain;">
</div>

*Left: Close-up of the steel fixture with machined key feature. Right: Recessed pocket machined into the ID expansion clamp for flat workbench mounting*


