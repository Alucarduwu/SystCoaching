<h1 align="center">⚙️ SystCoaching</h1>

<p align="center">
  <b>Advanced Coaching Management Platform</b><br/>
  <i>Sistema profesional de escritorio para gestión de atletas</i>
</p>

<p align="center">
<img src="https://img.shields.io/badge/Status-In%20Progress-6C63FF?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Desktop-Electron-1f1f1f?style=for-the-badge&logo=electron&logoColor=9FEAF9"/>
<img src="https://img.shields.io/badge/Frontend-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white"/>
<img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
</p>

---

## 🧩 Description | Descripción

**EN 🇺🇸**  
This project is a high-performance desktop application designed for professional coaches and health practitioners. It centralizes athlete management, biometric monitoring, and professional dossier generation in a unified system.

The platform focuses on real-time data visualization, historical biometric tracking, and automated professional reporting.

**ES 🇲🇽**  
Este proyecto es una aplicación de escritorio de alto rendimiento diseñada para entrenadores profesionales y preparadores físicos. Centraliza la gestión de atletas, el monitoreo biométrico y la generación de expedientes profesionales en un sistema unificado.

Se enfoca en la visualización de datos en tiempo real, el seguimiento histórico de biometría y la generación automatizada de reportes profesionales.

---

## 🎯 Problem | Problema

**EN 🇺🇸**  
In professional coaching environments:

- data is fragmented across multiple files  
- biometric history is difficult to analyze  
- report generation is slow and inconsistent  

**ES 🇲🇽**  
En entornos de coaching profesional:

- los datos están fragmentados en múltiples archivos  
- el historial biométrico es difícil de analizar  
- la generación de reportes es lenta e inconsistente  

---

## 💡 Solution | Solución

**EN 🇺🇸**  
This project provides a centralized desktop system with:

- unified data management  
- biometric analytics  
- automated dossier generation  

**ES 🇲🇽**  
Este proyecto proporciona un sistema centralizado con:

- gestión unificada de datos  
- analítica biométrica  
- generación automática de dossiers  

---

## ⚙️ Stack

- Angular 21  
- TypeScript  
- Electron  
- Better-SQLite3  
- Tailwind CSS  
- JSPDF  
- html2canvas  

---

## ✨ Features | Funcionalidades

**EN 🇺🇸**
- Athlete profile management  
- Biometric tracking system  
- Interactive data visualization  
- Professional PDF dossier generation  
- Offline-first desktop architecture  

**ES 🇲🇽**
- Gestión de perfiles de atleta  
- Sistema de seguimiento biométrico  
- Visualización interactiva de datos  
- Generación de dossiers PDF profesionales  
- Arquitectura de escritorio offline-first  

---

## 🧠 Architecture | Arquitectura

**EN 🇺🇸**
- Angular component-based architecture  
- Electron integration for desktop capabilities  
- Modular services with RxJS state management  
- Centralized design tokens  

**ES 🇲🇽**
- Arquitectura Angular basada en componentes  
- Integración con Electron para capacidades de escritorio  
- Servicios modulares con RxJS  
- Sistema de diseño centralizado  

---

## 🧩 Technical Challenges | Retos Técnicos

**EN 🇺🇸**
- High-density UI performance  
- Seamless PDF rendering  
- Local data persistence optimization  
- Electron + Angular integration  

**ES 🇲🇽**
- Rendimiento en UI de alta densidad  
- Renderizado fluido de PDF  
- Optimización de persistencia local  
- Integración Electron + Angular  

---

## 🚀 Improvements | Mejoras

**EN 🇺🇸**
- Better UI performance  
- Improved biometric comparison tools  
- Cleaner PDF templates  

**ES 🇲🇽**
- Mejor rendimiento en UI  
- Mejor comparación biométrica  
- Plantillas PDF más limpias  

---

## 📚 Learning | Aprendizajes

**EN 🇺🇸**
- Desktop application architecture  
- Electron + Angular integration  
- Advanced PDF generation  
- Local data management  

**ES 🇲🇽**
- Arquitectura de aplicaciones de escritorio  
- Integración Electron + Angular  
- Generación avanzada de PDF  
- Gestión de datos local  

---

## 📊 Status | Estado

- Production-ready core / Núcleo listo para producción  
- Continuous improvements / Mejoras continuas  
- In Progress / En proceso  

---
<!-- Used for portfolio parsing -->
# ⚙️ SYSTEM DATA (DO NOT EDIT FORMAT)

## PROJECT_DATA

name:
  en: SystCoaching - Desktop Performance Platform
  es: SystCoaching - Plataforma de Gestión de Rendimiento

description:
  en: Enterprise-style desktop application for athlete management, implementing full CRUD operations, biometric tracking, high-density analytics, and automated reporting pipelines
  es: Aplicación de escritorio estilo empresarial para la gestión de atletas, implementando operaciones CRUD completas, seguimiento biométrico, analítica de alta densidad y generación automatizada de reportes

problem:
  en: Athlete data is fragmented, lacks relational structure, and is difficult to query efficiently, preventing scalable tracking and structured analysis
  es: Los datos de atletas están fragmentados, sin estructura relacional y difíciles de consultar eficientemente, impidiendo escalabilidad y análisis estructurado

solution:
  en: Designed and implemented a centralized desktop system with normalized relational data models, full CRUD workflows, and optimized query handling for real-time athlete tracking and reporting
  es: Diseño e implementación de un sistema centralizado con modelos relacionales normalizados, flujos CRUD completos y consultas optimizadas para seguimiento y reporteo en tiempo real

stack:
  - Angular 21
  - Electron
  - TypeScript
  - SQLite
  - JSPDF

features:
  en:
    - Full CRUD system for athletes, biometrics, diets, and training routines
    - Relational data modeling with normalized SQLite schema
    - Optimized query handling for historical biometric analysis
    - Automated multi-entity PDF generation pipeline
    - State-driven UI updates with reactive data binding
    - High-density dashboard with dynamic filtering and search
  es:
    - Sistema CRUD completo para atletas, biometría, dietas y rutinas
    - Modelado relacional con esquema normalizado en SQLite
    - Consultas optimizadas para análisis histórico biométrico
    - Pipeline automatizado de generación de PDF multi-entidad
    - Actualización reactiva de UI basada en estado
    - Dashboard con filtros y búsqueda dinámica

architecture:
  en: Modular Angular architecture with service-based data layer, Electron IPC communication, and SQLite persistence using repository-like patterns
  es: Arquitectura modular en Angular con capa de servicios, comunicación IPC con Electron y persistencia en SQLite usando patrones tipo repositorio

technical_challenges:
  en:
    - Designing normalized relational schemas (patients, measurements, diets, routines) with efficient joins
    - Handling complex CRUD operations with data integrity and state synchronization
    - Optimizing UI rendering for large datasets using efficient change detection strategies
    - Building a dynamic PDF generation pipeline mapping relational data into structured documents
    - Managing communication between Electron main and renderer processes
  es:
    - Diseño de esquemas relacionales normalizados (pacientes, mediciones, dietas, rutinas) con joins eficientes
    - Manejo de operaciones CRUD complejas con integridad de datos y sincronización de estado
    - Optimización del renderizado de UI con grandes volúmenes de datos
    - Construcción de pipeline dinámico de PDF a partir de datos relacionales
    - Manejo de comunicación entre procesos de Electron

improvements:
  en:
    - Refactored data layer to separate concerns (UI / services / persistence)
    - Optimized SQL queries reducing redundant data fetching and improving performance
    - Implemented reusable data mappers for transforming DB data into UI models
    - Improved state handling for consistent UI updates after CRUD operations
    - Standardized PDF generation into reusable templates and pipelines
  es:
    - Refactorización de la capa de datos separando UI / servicios / persistencia
    - Optimización de queries SQL reduciendo redundancias
    - Implementación de mapeadores de datos reutilizables
    - Mejora en manejo de estado tras operaciones CRUD
    - Estandarización de generación de PDF en templates reutilizables

learning:
  en:
    - Designing and implementing full CRUD systems in desktop environments
    - Relational database modeling and query optimization (SQLite)
    - Applying separation of concerns and modular architecture patterns
    - Managing state-driven UIs with reactive frameworks
    - Building document pipelines from structured relational data
  es:
    - Diseño e implementación de sistemas CRUD completos en desktop
    - Modelado relacional y optimización de queries en SQLite
    - Aplicación de separación de responsabilidades y arquitectura modular
    - Manejo de UI reactiva basada en estado
    - Construcción de pipelines de documentos a partir de datos estructurados

status:
  en: In Progress (Actively evolving with continuous architectural improvements)
  es: En proceso (Evolución activa con mejoras arquitectónicas continuas)

future:
  en:
    - Migration to API-based backend (Node.js / REST)
    - Implementation of authentication and role-based access control (RBAC)
    - Cloud sync with distributed data storage
    - Integration of AI models for predictive analytics
  es:
    - Migración a backend basado en APIs (Node.js / REST)
    - Implementación de autenticación y control de roles (RBAC)
    - Sincronización en la nube
    - Integración de IA para análisis predictivo

repo: https://github.com/Alucarduwu/SystCoaching
demo: Desktop Application
---

## 💎 Why SystCoaching? | ¿Por qué SystCoaching?

**EN 🇺🇸**  
SystCoaching is not just another management tool; it's a **Command Center** for high-performance coaches who demand professional excellence. It bridges the gap between raw biometric data and premium client presentation through the **Mega Dossier Engine**.

**ES 🇲🇽**  
SystCoaching no es simplemente otra herramienta de gestión; es un **Centro de Mando** para entrenadores de alto rendimiento que exigen excelencia profesional. Cierra la brecha entre los datos biométricos crudos y una presentación premium para el cliente a través del motor **Mega Dossier**.

---

## 🚀 Key Value Pillars | Pilares de Valor

- **Ultra-Performance**: Built with **Electron & Better-SQLite3** for instantaneous data access without internet dependency.  
- **Glassmorphism Design**: A premium, dark-themed interface that feels like high-end pro-software.  
- **Dossier Professionalization**: Transform complex nutrition and training protocols into elegant, printable PDFs in seconds.  

---

## 🛠️ Premium Technical Stack | Stack Técnico de Élite

| Tech | Role | Advantage |
| --- | --- | --- |
| **Angular 21** | Frontend Framework | State-of-the-art component architecture and type safety. |
| **Electron** | Desktop Runtime | OS-level performance with a beautiful glassmorphic UI. |
| **Better-SQLite3** | Native Database | The fastest SQLite driver for Node.js, ensuring zero latency. |
| **Tailwind CSS** | Design System | Utility-first styling for a pixel-perfect, modern aesthetic. |
| **JSPDF engine** | PDF Generation | Custom-built hybrid rendering for high-fidelity professional reports. |

---

## 🎨 Visual Identity | Identidad Visual

**EN 🇺🇸**  
The interface follows an **"Elite Tactical"** aesthetic, using deep blacks, vibrant emerald accents, and glassmorphism to convey authority and technical precision. Every interaction is designed to feel snappy and professional.

**ES 🇲🇽**  
La interfaz sigue una estética **"Elite Tactical"**, utilizando negros profundos, acentos esmeralda vibrantes y glassmorphism para transmitir autoridad y precisión técnica. Cada interacción está diseñada para sentirse rápida y profesional.

---

## 🌐 Live Demo

👉 Desktop Application

---

## 🚀 Installation

git clone https://github.com/Alucarduwu/SystCoaching.git  
cd SystCoaching  
npm install  
npm run electron-dev  

---

## 👩‍💻 Author

**Anahí Lozano**

- LinkedIn: https://www.linkedin.com/in/anahi-lozano-de-lira-a4213a187/  
- Portfolio: https://portafolioanahi.vercel.app/  
- Email: anahydlira@gmail.com  

---

<p align="center">
💜 Built to professionalize athlete management
</p>
