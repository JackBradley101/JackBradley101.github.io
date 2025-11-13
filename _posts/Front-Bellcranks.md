---
layout: post
title: "Topology Optimized Front Bellcranks"
date: 2024-05-12
tags: [FUBC, Machining, FEA]
image: /images/BELLCRANK/bellcrank-0.jpg
---

In my first season on the team, I redesigned our front bellcranks using parametric CAD, FEA, and topology optimization to cut mass while increasing stiffness and simplifying the assembly.

<!--more-->

On our Formula UBC car, the front bellcrank links the pullrods to the dampers and sets the effective motion ratio of the front suspension. I redesigned it to be lighter, stiffer, and faster to manufacture.

![Topology-optimized bellcrank CAD](/images/BELLCRANK/bellcrank-0.jpg)

### Goals

- **Cut mass** to reduce unsprung weight and improve responsiveness  
- **Increase stiffness** so the linkage behaves like an ideal lever, not a spring  
- **Simplify manufacturing** to save time and improve repeatability  

### Design & Analysis

- Rebuilt the bellcrank as a parametric model in **SolidWorks**  
- Ran **FEA** to study stress and deflection under peak suspension loads  
- Used **topology optimization** to guide the final geometry  
- Simplified the bearing stack to reduce part count and improve load paths  

**Outcome (vs previous design):**

- ~**20% mass reduction**  
- ~**35% increase in stiffness** (from deflection comparisons in FEA)  

![FEA and optimization results](/images/BELLCRANK/FBC-1.jpg)

### Manufacturing

- **Bellcrank plates:**  
  - **7075-T6 aluminum**, waterjet cut and honed to press onto the bearing assembly  
- **Bearing assembly:**  
  - Turned **6061 aluminum** components plus bearing + retaining ring  
- **Chassis mount:**  
  - Machined on a **4-axis CNC** to maintain pivot alignment and match the complex carbon monocoque surface  

![Machined bellcrank assembly](/images/BELLCRANK/FBC-2.jpg)

### Results & Takeaways

- Achieved a **lighter, stiffer** linkage with about **30% less production time**  
- Got end-to-end experience: CAD → FEA/optimization → machining → integration  
- Learned how to balance **optimization** with manufacturability and assembly, and how small choices in the bearing stack and interfaces affect real-world stiffness and serviceability  

