const { app, BrowserWindow, ipcMain, protocol, net, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { pathToFileURL } = require("url");
const database = require("./database");

app.name = "SystCoaching";

// Registrar protocolo privilegiado antes de que la app esté lista
protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'coachimg', 
    privileges: { 
      secure: true, 
      standard: true, 
      supportFetchAPI: true, 
      corsEnabled: true,
      bypassCSP: true,
      stream: true 
    } 
  }
]);

let mainWindow = null;
const isDev = !app.isPackaged;

console.log("[MAIN] Archivo main.js cargado");
console.log("[MAIN] app.isPackaged:", app.isPackaged);
console.log("[MAIN] __dirname:", __dirname);

function waitForAngularServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function checkServer() {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            console.log(`[MAIN] Angular respondió correctamente en ${url}`);
            resolve(true);
          } else {
            retry();
          }
        })
        .on("error", retry);
    }

    function retry() {
      if (Date.now() - start > timeout) {
        reject(new Error(`No se pudo conectar a ${url} en ${timeout}ms`));
        return;
      }
      setTimeout(checkServer, 500);
    }

    checkServer();
  });
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log("[MAIN] Directorio creado:", dirPath);
  }
}

function sanitizeFileName(fileName = "archivo") {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

  return `${safeBase || "archivo"}${ext || ""}`;
}


function buildImageProtocolUrl(filePath) {
  return `coachimg://file/${encodeURIComponent(filePath)}`;
}

function protocolUrlToFilePath(url) {
  // Common prefixes in Electron for custom protocols
  const prefixes = ["coachimg://file/", "coachimg://file", "coachimg://"];
  let pathPart = url;
  
  for (const p of prefixes) {
    if (url.startsWith(p)) {
      pathPart = url.slice(p.length);
      break;
    }
  }

  // Remove leading slashes if they are not part of a Windows drive (e.g. /C:/)
  if (pathPart.startsWith('/') && pathPart[2] === ':') {
    pathPart = pathPart.slice(1);
  }

  try {
    return decodeURIComponent(pathPart);
  } catch (e) {
    return pathPart;
  }
}

function registerImageProtocol() {
  console.log("[MAIN] Registrando protocolo coachimg://");

  protocol.handle("coachimg", async (request) => {
    const url = request.url;
    console.log("[PROTOCOL] Recibida petición:", url);
    
    try {
      const filePath = protocolUrlToFilePath(url);
      console.log("[PROTOCOL] Ruta física resuelta:", filePath);

      if (!filePath || !fs.existsSync(filePath)) {
        console.error("[PROTOCOL] Archivo no encontrado:", filePath);
        return new Response("No encontrado", { status: 404 });
      }

      // Usar net.fetch con file:// URL para mayor compatibilidad
      const fileUrl = pathToFileURL(filePath).toString();
      return net.fetch(fileUrl);
    } catch (error) {
      console.error("[PROTOCOL] Error crítico en handler:", error);
      return new Response("Error de protocolo", { status: 500 });
    }
  });
}

async function createWindow() {
  console.log("[MAIN] createWindow() iniciado");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    frame: true,
    resizable: true,
    center: true,
    title: "SystCoaching",
    backgroundColor: "#050506",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Forzar que NO se abra en pantalla completa o maximizada por defecto
  mainWindow.setFullScreen(false);
  mainWindow.unmaximize();
  mainWindow.center();

  // Cargar Splash Screen inmediatamente
  const splashPath = path.join(__dirname, "splash.html");
  if (fs.existsSync(splashPath)) {
    console.log("[MAIN] Mostrando pantalla de carga...");
    await mainWindow.loadFile(splashPath);
  }

  console.log("[MAIN] preload path:", path.join(__dirname, "preload.js"));

  if (isDev) {
    const devUrl = "http://localhost:4200";

    try {
      console.log("[MAIN] Esperando servidor Angular:", devUrl);
      await waitForAngularServer(devUrl);
      await mainWindow.loadURL(devUrl);
      console.log("[MAIN] Ventana cargada con Angular dev");
    } catch (error) {
      console.error("[MAIN] Error cargando Angular en desarrollo:", error.message);
      await mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
          encodeURIComponent(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 30px; background: #050506; color: #f8fafc;">
                <h2>SystCoaching</h2>
                <p>No se pudo conectar a Angular en desarrollo.</p>
                <p>Asegúrate de que <strong>ng serve</strong> esté corriendo en <strong>http://localhost:4200</strong>.</p>
              </body>
            </html>
          `)
      );
    }
  } else {
    const prodIndexPath = path.join(__dirname, "../dist/syst-coaching/browser/index.html");
    console.log("[MAIN] Cargando build production:", prodIndexPath);
    await mainWindow.loadFile(prodIndexPath);
  }

  mainWindow.on("closed", () => {
    console.log("[MAIN] Ventana cerrada");
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log("[MAIN] app.whenReady()");
  registerImageProtocol();
  createWindow();

  app.on("activate", () => {
    console.log("[MAIN] app activate");
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


app.on("window-all-closed", () => {
  console.log("[MAIN] window-all-closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("uncaughtException", (error) => {
  console.error("[MAIN] uncaughtException:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[MAIN] unhandledRejection:", reason);
});

/* =========================
   IPC BASE
   ========================= */

console.log("[MAIN] Registrando handlers IPC...");

ipcMain.handle("app:ping", async () => {
  console.log("[IPC] app:ping");
  return {
    ok: true,
    message: "Electron conectado correctamente",
    appPath: app.getAppPath(),
    userDataPath: app.getPath("userData")
  };
});

ipcMain.handle("app:get-paths", async () => {
  console.log("[IPC] app:get-paths");
  return {
    userData: app.getPath("userData"),
    documents: app.getPath("documents"),
    desktop: app.getPath("desktop"),
    downloads: app.getPath("downloads")
  };
});

ipcMain.handle("db:init", async () => {
  console.log("[IPC] db:init");
  return database.init();
});

ipcMain.handle("patients:get-all", async () => {
  console.log("[IPC] patients:get-all");
  try {
    const data = database.patient.getAll();
    console.log("[IPC] patients:get-all OK. Total:", data?.length || 0);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] patients:get-all ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("patients:get-by-id", async (_, id) => {
  console.log("[IPC] patients:get-by-id", id);
  try {
    return {
      ok: true,
      data: database.patient.getById(id)
    };
  } catch (error) {
    console.error("[IPC] patients:get-by-id ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("patients:create", async (_, payload) => {
  console.log("[IPC] patients:create payload:", payload);
  try {
    const data = database.patient.create(payload);
    console.log("[IPC] patients:create OK. ID:", data?.id);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] patients:create ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("patients:update", async (_, payload) => {
  console.log("[IPC] patients:update payload:", payload);
  try {
    const data = database.patient.update(payload);
    console.log("[IPC] patients:update OK. ID:", data?.id);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] patients:update ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("patients:delete", async (_, id) => {
  console.log("[IPC] patients:delete", id);
  try {
    return database.patient.delete(id);
  } catch (error) {
    console.error("[IPC] patients:delete ERROR:", error);
    return {
      ok: false,
    };
  }
});

ipcMain.handle("measurements:create", async (_, payload) => {
  console.log("[IPC] measurements:create payload:", payload);
  try {
    const data = database.measurement.create(payload);
    console.log("[IPC] measurements:create OK. ID:", data?.id);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] measurements:create ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});


ipcMain.handle("measurements:delete", async (_, measurementId) => {
  console.log("[IPC] measurements:delete", measurementId);
  try {
    const data = database.measurement.delete(measurementId);
    console.log("[IPC] measurements:delete OK:", data);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] measurements:delete ERROR:", error);
    return {
      ok: false,
    };
  }
});

ipcMain.handle("measurements:update", async (_, payload) => {
  console.log("[IPC] measurements:update payload:", payload);
  try {
    const data = database.measurement.update(payload);
    console.log("[IPC] measurements:update OK. ID:", data?.id);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] measurements:update ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});


ipcMain.handle("patients:get-profile", async (_, patientId) => {
  console.log("[IPC] patients:get-profile", patientId);
  try {
    const data = database.patientProfile(patientId);
    console.log("[IPC] patients:get-profile OK:", data ? "Encontrado" : "No encontrado");
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] patients:get-profile ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("exercises:get-all", async () => {
  try {
    const data = database.exercise.getAll();
    return { ok: true, data };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("exercises:get-by-id", async (_, id) => {
  try { return { ok: true, data: database.exercise.getById(id) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("exercises:create", async (_, payload) => {
  try { return { ok: true, data: database.exercise.create(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("exercises:update", async (_, payload) => {
  try { return { ok: true, data: database.exercise.update(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("exercises:delete", async (_, id) => {
  try { return { ok: true, data: database.exercise.delete(id) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("foods:get-all", async () => {
  console.log("[IPC] foods:get-all");
  try {
    const data = database.foods.getAll();
    console.log("[IPC] foods:get-all OK. Total:", data?.length || 0);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] foods:get-all ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("foods:get-by-id", async (_, id) => {
  console.log("[IPC] foods:get-by-id", id);
  try {
    return {
      ok: true,
      data: database.foods.getById(id)
    };
  } catch (error) {
    console.error("[IPC] foods:get-by-id ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("foods:create", async (_, payload) => {
  console.log("[IPC] foods:create payload:", payload);
  try {
    const data = database.foods.create(payload);
    console.log("[IPC] foods:create OK. ID:", data?.id);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] foods:create ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("foods:update", async (_, payload) => {
  console.log("[IPC] foods:update payload:", payload);
  try {
    const data = database.foods.update(payload);
    console.log("[IPC] foods:update OK. ID:", data?.id);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] foods:update ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("foods:delete", async (_, id) => {
  console.log("[IPC] foods:delete", id);
  try {
    const data = database.foods.delete(id);
    console.log("[IPC] foods:delete OK:", data);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] foods:delete ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

/* =========================
   IPC FOTOS DE MEDICIONES
   ========================= */

console.log("[MAIN] Registrando handlers de measurement photos...");

ipcMain.handle("measurement-photos:get-by-measurement", async (_, measurementId) => {
  console.log("[IPC] measurement-photos:get-by-measurement", measurementId);
  try {
    const data = database.measurementPhoto.getByMeasurementId(measurementId);
    console.log("[IPC] measurement-photos:get-by-measurement OK. Total:", data?.length || 0);
    return {
      ok: true,
      data
    };
  } catch (error) {
    console.error("[IPC] measurement-photos:get-by-measurement ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("measurement-photos:create", async (_, payload) => {
  console.log("[IPC] measurement-photos:create llamado");
  console.log("[IPC] measurement-photos:create payload keys:", payload ? Object.keys(payload) : null);

  try {
    const measurementId = Number(payload?.measurement_id);
    console.log("[IPC] measurementId:", measurementId);

    if (!measurementId || Number.isNaN(measurementId)) {
      throw new Error("measurement_id inválido.");
    }

    const measurement = database.measurement.getById(measurementId);
    console.log("[IPC] measurement encontrada:", measurement);

    if (!measurement) {
      throw new Error("No se encontró la medición asociada.");
    }

    const patient = database.patient.getById(measurement.patient_id);
    console.log("[IPC] patient encontrado:", patient);

    if (!patient) {
      throw new Error("No se encontró el paciente asociado a la medición.");
    }

    const file = payload?.file;
    console.log("[IPC] file metadata:", file ? {
      name: file.name,
      type: file.type,
      hasBufferArray: Array.isArray(file.buffer),
      bufferLength: Array.isArray(file.buffer) ? file.buffer.length : null
    } : null);

    if (!file || !file.name || !Array.isArray(file.buffer)) {
      throw new Error("No se recibió una imagen válida.");
    }

    const uploadsBaseDir = path.join(app.getPath("userData"), "uploads", "progress-photos");
    const patientDir = path.join(uploadsBaseDir, `patient-${patient.id}`);
    const measurementDir = path.join(patientDir, `measurement-${measurementId}`);

    console.log("[IPC] uploadsBaseDir:", uploadsBaseDir);
    console.log("[IPC] patientDir:", patientDir);
    console.log("[IPC] measurementDir:", measurementDir);

    ensureDir(measurementDir);

    const safeName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${safeName}`;
    const absoluteFilePath = path.join(measurementDir, uniqueName);

    console.log("[IPC] safeName:", safeName);
    console.log("[IPC] uniqueName:", uniqueName);
    console.log("[IPC] absoluteFilePath:", absoluteFilePath);

    fs.writeFileSync(absoluteFilePath, Buffer.from(file.buffer));
    console.log("[IPC] Archivo escrito correctamente");

    const imageUrl = buildImageProtocolUrl(absoluteFilePath);
    console.log("[IPC] imageUrl:", imageUrl);

    const savedPhoto = database.measurementPhoto.create({
      measurement_id: measurementId,
      fecha: payload?.fecha || measurement.fecha || null,
      image_url: imageUrl,
      nota: payload?.nota || null
    });

    console.log("[IPC] Foto guardada en BD:", savedPhoto);

    return {
      ok: true,
      data: savedPhoto
    };
  } catch (error) {
    console.error("[IPC] measurement-photos:create ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

ipcMain.handle("measurement-photos:delete", async (_, photoId) => {
  console.log("[IPC] measurement-photos:delete", photoId);

  try {
    const existing = database.measurementPhoto.getById(photoId);
    console.log("[IPC] Foto existente:", existing);

    if (!existing) {
      throw new Error("No se encontró la foto.");
    }

    const result = database.measurementPhoto.delete(photoId);
    console.log("[IPC] Resultado delete BD:", result);

    const physicalPath =
      existing.image_url?.startsWith("coachimg://file/")
        ? protocolUrlToFilePath(existing.image_url)
        : existing.image_url?.startsWith("file://")
        ? existing.image_url.replace("file://", "")
        : null;

    console.log("[IPC] physicalPath calculado:", physicalPath);

    if (result?.ok && physicalPath && fs.existsSync(physicalPath)) {
      fs.unlinkSync(physicalPath);
      console.log("[IPC] Archivo físico eliminado");
    }

    return {
      ok: true,
      data: result
    };
  } catch (error) {
    console.error("[IPC] measurement-photos:delete ERROR:", error);
    return {
      ok: false,
      error: error.message
    };
  }
});

/* =========================
   IPC BÓVEDA DE DOCUMENTOS
   ========================= */

console.log("[MAIN] Registrando handlers de boveda de documentos...");

ipcMain.handle("generated-documents:save", async (_, payload) => {
  console.log("[IPC] generated-documents:save llamado");
  try {
    const patientId = Number(payload.patient_id);
    const fileName = payload.nombre || "documento.pdf";
    const buffer = Buffer.from(payload.buffer);
    const type = payload.tipo || 'pdf';
    const metadata = payload.metadata || {};

    // Directorio base para PDFs
    const uploadsDir = path.join(app.getPath("userData"), "uploads", "pdfs");
    const patientDir = path.join(uploadsDir, `patient-${patientId}`);
    ensureDir(patientDir);

    const safeName = sanitizeFileName(fileName);
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(patientDir, uniqueName);

    fs.writeFileSync(filePath, buffer);
    console.log("[IPC] Documento PDF guardado en:", filePath);

    const dbResult = database.documents.create({
      patient_id: patientId,
      nombre: fileName,
      tipo: type,
      file_path: filePath,
      metadata: metadata
    });

    return { 
      ok: true, 
      data: { 
        id: dbResult.id, 
        file_path: filePath 
      } 
    };
  } catch (error) {
    console.error("[IPC] generated-documents:save ERROR:", error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("generated-documents:open", async (_, filePath) => {
  console.log("[IPC] generated-documents:open", filePath);
  try {
    if (fs.existsSync(filePath)) {
      shell.openPath(filePath);
      return { ok: true };
    }
    throw new Error("El archivo ya no existe.");
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("dialog:save-file", async (event, { filename, buffer }) => {
  console.log("[IPC] dialog:save-file llamado para:", filename);
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
      title: "Guardar Reporte Técnico",
      defaultPath: filename,
      filters: [ { name: "Reportes PDF", extensions: ["pdf"] } ]
    });

    if (canceled || !filePath) return { ok: false, error: "Cancelado por usuario" };

    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log("[IPC] Archivo guardado manualmente en:", filePath);
    return { ok: true, filePath };
  } catch (error) {
    console.error("[IPC] dialog:save-file ERROR:", error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("generated-documents:delete", async (_, id) => {
  console.log("[IPC] generated-documents:delete", id);
  try {
    // Note: To delete the file, we'd need getById for documents in database.js
    // For now, let's at least remove from DB.
    const res = database.documents.delete(id);
    return { ok: true, data: res };
  } catch (error) {
    console.error("[IPC] generated-documents:delete ERROR:", error);
    return { ok: false, error: error.message };
  }
});


ipcMain.handle("foods:search", async (_, query) => {
  try { return { ok: true, data: database.foods.search(query) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("exercises:search", async (_, query) => {
  try { return { ok: true, data: database.exercise.search(query) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("diets:create-full", async (_, payload) => {
  try { return { ok: true, data: database.diet.createFull(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("diets:update-full", async (_, payload) => {
  try { return { ok: true, data: database.diet.updateFull(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("routines:create-full", async (_, payload) => {
  try { return { ok: true, data: database.routine.createFull(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("routines:update-full", async (_, payload) => {
  try { return { ok: true, data: database.routine.updateFull(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("diets:delete", async (_, id) => {
  try { return { ok: true, data: database.diet.delete(id) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("diets:get-full", async (_, id) => {
  try { return { ok: true, data: database.dietFull(id) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("routines:delete", async (_, id) => {
  try { return { ok: true, data: database.routine.delete(id) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("diets:get-by-patient", async (_, patientId) => {
  console.log("[IPC] diets:get-by-patient", patientId);
  try {
    return { ok: true, data: database.diet.getByPatientId(patientId) };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("comparisons:create", async (_, payload) => {
  try { return { ok: true, data: database.comparisons.create(payload) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("comparisons:get-by-patient", async (_, patientId) => {
  try { return { ok: true, data: database.comparisons.getByPatient(patientId) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("comparisons:delete", async (_, id) => {
  try { return { ok: true, data: database.comparisons.delete(id) }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("measurements:get-by-patient", async (_, patientId) => {
  console.log("[IPC] measurements:get-by-patient", patientId);
  try {
    return { ok: true, data: database.measurement.getByPatientId(patientId) };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("routines:get-by-patient", async (_, patientId) => {
  console.log("[IPC] routines:get-by-patient", patientId);
  try {
    return { ok: true, data: database.routine.getByPatient(patientId) };
  } catch(e) {
    return { ok: false, error: e.message };
  }
});

console.log("[MAIN] Todos los handlers IPC quedaron registrados");