<h1 align="center">Sistema de Gestión de Cobranzas 💼</h1>

<p align="center">
  Sistema de Inteligencia Financiera y Autogestión de Cobranzas mediante Agentes Autónomos y Análisis Predictivo para la empresa<br/>
  <strong>Promotora Los Teques C.A.</strong>
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white"/>
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-13+-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
  <img alt="License" src="https://img.shields.io/badge/Licencia-MIT-green?style=flat-square"/>
  <img alt="Status" src="https://img.shields.io/badge/Estado-En%20desarrollo-yellow?style=flat-square"/>
</p>

---

## 📋 Descripción

El **Sistema de Gestión de Cobranzas** es una aplicación web desarrollada con arquitectura de microservicios que automatiza y centraliza todos los procesos relacionados con la recuperación de cartera de **Promotora Los Teques C.A.**

El sistema opera bajo un modelo de **panel administrativo interno + portal de autogestión para clientes**: el personal autorizado gestiona reportes, pagos y clientes desde el panel admin, mientras que cada cliente puede consultar su estado de cuenta, deudas pendientes y registrar pagos con comprobante desde su portal personal.

---

## ✨ Características principales

### 🔐 Seguridad y Autenticación
- 🔹 Login unificado con detección automática de rol (admin / cliente)
- 🔹 Roles diferenciados: Administrador, Operador y Cliente
- 🔹 Sesiones con doble token JWT (access 15min + refresh 7d)
- 🔹 Recuperación de contraseña mediante **código de 6 dígitos vía Gmail** (válido 10 minutos)
- 🔹 Control de acceso por roles (RBAC) en cada endpoint

### 🧾 Gestión de Facturación
- 🔹 Creación de recibos de pago vinculados a clientes y empresas
- 🔹 Estados de pagos: Pendiente → Vencida → Mora → Pagada / Anulada
- 🔹 Selector de empresa dependiente del cliente seleccionado
- 🔹 Notificación automática por email al cliente en facturas vencidas
- 🔹 Envío manual de aviso por recibos de pagos individuales desde el panel

### 💳 Gestión de Pagos
- 🔹 Registro de pagos en Bolívares (VES) y Dólares (USD)
- 🔹 Conversión automática USD → VES con tasa BCV en tiempo real
- 🔹 **Comprobantes de pago guardados en disco** (JPG, PNG, PDF — máx. 5MB)
- 🔹 Reversión de pagos con restauración del estado del recibo
- 🔹 Historial de cobros de los últimos 7 días con gráfica en el dashboard

### 🏢 Gestión de Clientes y Empresas
- 🔹 Registro público de clientes (autoregistro desde la landing page)
- 🔹 Clientes vinculados a una o varias empresas con RIF
- 🔹 Panel expandible por cliente con sus empresas asociadas
- 🔹 Activación / desactivación de empresas

### 🤖 Bot y Automatización
- 🔹 Sincronización automática de la tasa BCV vía dolarapi.com (cron diario)
- 🔹 Notificaciones automáticas por Gmail a clientes con facturas vencidas (8:00 AM Caracas)
- 🔹 Filtro anti-spam: no notifica si ya fue avisado en las últimas 24 horas

### 🧠 Inteligencia Artificial
- 🔹 Clasificación de riesgo crediticio con red neuronal **Brain.js** (bajo / medio / alto)
- 🔹 OCR de comprobantes con **Tesseract.js** para validación automática
- 🔹 Entrenamiento basado en: promedio de retraso, tasa de cumplimiento, cobertura de pago y frecuencia de efectivo

### 🖥️ Portal del Cliente
- 🔹 Dashboard con deuda total pendiente en VES y USD
- 🔹 Selector de empresa para filtrar información por razón social
- 🔹 Tres secciones: Inicio, Deudas Pendientes e Historial de Pagos
- 🔹 Notificación de pagos con subida de comprobante desde el portal
- 🔹 Descarga de resumen de pago en PDF
- 🔹 Modo oscuro / claro con persistencia

### 📊 Dashboard Administrativo
- 🔹 KPIs en tiempo real: clientes activos, recibos emitidos, saldo pendiente y pagos del día
- 🔹 Gráfica de cobros de los últimos 7 días
- 🔹 Distribución de recibos de pago por estado (dona interactiva)
- 🔹 Exportación de clientes a Excel (CSV)
- 🔹 Tasa BCV actual visible en el panel

---

## 🗂️ Estructura del proyecto

```
avoblanher/
├── api-gateway/                   # Enrutador central (puerto 8080)
│   ├── src/
│   │   ├── config/                # Logger Winston
│   │   ├── middlewares/           # Autenticación JWT, RBAC
│   │   └── server.js              # Proxy hacia microservicios
│   └── .env.example
│
├── auth-service/                  # Autenticación y usuarios (puerto 3001)
│   ├── src/
│   │   ├── application/services/  # AuthService — login, registro, reset password
│   │   ├── domain/                # Entidades y contratos del dominio
│   │   └── infrastructure/        # UserModel, UserRepository, logger
│   ├── migrations/
│   └── .env.example
│
├── billing-service/               # Facturación y pagos (puerto 3002)
│   ├── src/
│   │   ├── application/services/  # InvoiceService, PaymentService, AccountService
│   │   ├── infrastructure/
│   │   │   ├── adapters/          # BcvAdapter, UploadAdapter (multer)
│   │   │   ├── models/            # InvoiceModel, PaymentModel, CompanyModel
│   │   │   └── repositories/      # InvoiceRepository, PaymentRepository
│   │   └── interfaces/            # Controllers y rutas REST
│   ├── uploads/comprobantes/      # Comprobantes de pago en disco
│   ├── migrations/
│   └── .env.example
│
├── ia-service/                    # Inteligencia Artificial (puerto 3003)
│   ├── src/
│   │   ├── application/services/  # RiskService (Brain.js), OcrService (Tesseract)
│   │   └── infrastructure/        # RiskClassificationModel, Repository
│   ├── migrations/
│   └── .env.example
│
├── bot-service/                   # Automatización y notificaciones (puerto 3004)
│   ├── src/
│   │   ├── application/services/  # BCVSyncAgent, NotificationAgent
│   │   ├── infrastructure/
│   │   │   └── adapters/          # GmailAdapter (Nodemailer)
│   │   └── interfaces/            # Controllers y rutas REST
│   ├── migrations/
│   └── .env.example
│
├── frontend/                      # Interfaz de usuario (puerto 3000)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/             # Dashboard, Clientes, Recibos, Pagos, Riesgo, Bot
│   │   │   └── portal/            # PortalDashboard (cliente)
│   │   ├── components/shared/     # Navbar, StatusBadge, ProtectedRoute
│   │   ├── context/               # AuthContext, PortalAuthContext, I18nContext
│   │   └── api/                   # Instancias Axios configuradas
│   └── .env.example
│
├── db-setup/
│   └── avoblanher_db.sql          # Script completo de creación de BD
└── .gitignore
```

---

## 📦 Instalación

### Requisitos previos

- **Node.js** 18 o superior
- **PostgreSQL** 13 o superior con pgAdmin 4
- **Git**

### 1. Clonar el repositorio

```bash
git clone https://github.com/UPTAMCA/2026-T402-G02.git
cd 2026-T402-G02
```

### 2. Crear la base de datos

1. Abre **pgAdmin 4**
2. Clic derecho en Databases → **Create → Database** → nombre: `avoblanher_db`
3. Clic derecho en `avoblanher_db` → **Query Tool**
4. Abre y ejecuta el archivo `db-setup/avoblanher_db.sql`

### 3. Configurar variables de entorno

En cada servicio existe un `.env.example`. Copia y renombra a `.env`:

```powershell
copy auth-service\.env.example    auth-service\.env
copy billing-service\.env.example billing-service\.env
copy ia-service\.env.example      ia-service\.env
copy bot-service\.env.example     bot-service\.env
copy api-gateway\.env.example     api-gateway\.env
copy frontend\.env.example        frontend\.env
```

> ⚠️ El `JWT_SECRET` debe ser **idéntico** en todos los servicios.

### 4. Instalar dependencias y ejecutar migraciones

Abre una terminal por cada servicio y ejecuta:

```powershell
# auth-service
cd auth-service
npm install
npx sequelize-cli db:migrate
node src/server.js

# billing-service
cd billing-service
npm install
npx sequelize-cli db:migrate
node src/server.js

# ia-service
cd ia-service
npm install
npx sequelize-cli db:migrate
node src/server.js

# bot-service
cd bot-service
npm install
npx sequelize-cli db:migrate
node src/server.js

# api-gateway
cd api-gateway
npm install
node src/server.js

# frontend
cd frontend
npm install
npm run dev
```

### 5. Verificar que todos los servicios están activos

```
http://localhost:3001/health  →  auth-service    ✅
http://localhost:3002/health  →  billing-service ✅
http://localhost:3003/health  →  ia-service      ✅
http://localhost:3004/health  →  bot-service     ✅
http://localhost:8080/health  →  api-gateway     ✅
http://localhost:3000         →  frontend        ✅
```

### 6. Primer acceso 🚀

Accede a **http://localhost:3000** en tu navegador.

Genera el hash de tu contraseña de administrador desde PowerShell:

```powershell
cd auth-service
node -e "require('bcryptjs').hash('TuContraseña', 12).then(h => console.log(h))"
```

Luego en pgAdmin ejecuta:

```sql
UPDATE users
SET password = 'HASH_GENERADO_AQUI'
WHERE email = 'admin@avoblanher.com';
```

> ⚠️ **Importante:** Cambia la contraseña del admin inmediatamente después del primer login.

---

## 🗺️ Rutas principales

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing page informativa | Todos |
| `/login` | Inicio de sesión unificado | Todos |
| `/registro` | Registro de cliente | Todos |
| `/dashboard` | Panel de control con KPIs | Admin / Supervisor / Operador |
| `/clients` | Gestión de clientes y empresas | Admin / Supervisor / Operador |
| `/invoices` | Gestión de recibos de pago | Admin / Supervisor / Operador |
| `/payments` | Gestión de pagos y comprobantes | Admin / Supervisor / Operador |
| `/risk` | Clasificación de riesgo IA | Admin / Supervisor / Operador |
| `/bot` | Configuración bot y notificaciones | Admin |
| `/portal` | Dashboard del cliente | Cliente |
| `/portal/pendientes` | Deudas pendientes del cliente | Cliente |
| `/portal/pagos` | Historial de pagos del cliente | Cliente |

---

## 👥 Roles del sistema

| Rol | Descripción |
|-----|-------------|
| 🔴 **Administrador** | Acceso total: gestiona usuarios, configura bot, ve auditoría completa |
| 🟢 **Operador** | Consulta clientes, recibos y pagos. Sin acceso al bot |
| 🔵 **Cliente** | Accede solo a su portal personal de autogestión |

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! 🎉

1. Haz **fork** del repositorio
2. Crea una rama descriptiva:
   ```bash
   git checkout -b feature/nombre-de-la-funcionalidad
   ```
3. Realiza tus cambios y haz commit:
   ```bash
   git commit -m "feat: descripcion clara del cambio"
   ```
4. Sube tu rama:
   ```bash
   git push origin feature/nombre-de-la-funcionalidad
   ```
5. Abre un **Pull Request** con descripción detallada del cambio 💡

---

## 📜 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

## 📧 Contacto

Proyecto académico desarrollado en la **Universidad Politécnica Territorial de Los Altos Mirandinos "Cecilio Acosta" (UPTAMCA)**  
Programa Nacional de Formación en Informática — Trayecto IV, Sección 2

| Integrante | Cédula | Correo |
|------------|--------|--------|
| Franco Avolio | 31.490.068 | dev.franco2005@gmail.com |


**Tutor:** Ing. Christopher Gedler

📞 +58 412 250 99 21
📞 +58 422 150 48 21