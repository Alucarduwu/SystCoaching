const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => ipcRenderer.invoke("app:ping"),
  getPaths: () => ipcRenderer.invoke("app:get-paths"),

  saveTextFile: (payload) => ipcRenderer.invoke("file:save-text", payload),
  readTextFile: () => ipcRenderer.invoke("file:read-text"),

  initDatabase: () => ipcRenderer.invoke("db:init"),
  testDatabase: () => ipcRenderer.invoke("db:test"),

  patients: {
    getAll: () => ipcRenderer.invoke("patients:get-all"),
    getById: (id) => ipcRenderer.invoke("patients:get-by-id", id),
    create: (payload) => ipcRenderer.invoke("patients:create", payload),
    update: (payload) => ipcRenderer.invoke("patients:update", payload),
    delete: (id) => ipcRenderer.invoke("patients:delete", id),
    getProfile: (id) => ipcRenderer.invoke("patients:get-profile", id)
  },

  measurements: {
    create: (payload) => ipcRenderer.invoke("measurements:create", payload),
    update: (payload) => ipcRenderer.invoke("measurements:update", payload),
    getByPatient: (patientId) => ipcRenderer.invoke("measurements:get-by-patient", patientId),
    delete: (measurementId) => ipcRenderer.invoke("measurements:delete", measurementId)
  },

  measurementPhotos: {
    create: (payload) => ipcRenderer.invoke("measurement-photos:create", payload),
    getByMeasurement: (measurementId) =>
      ipcRenderer.invoke("measurement-photos:get-by-measurement", measurementId),
    delete: (photoId) => ipcRenderer.invoke("measurement-photos:delete", photoId)
  },

  exercises: {
    getAll: () => ipcRenderer.invoke("exercises:get-all"),
    getById: (id) => ipcRenderer.invoke("exercises:get-by-id", id),
    create: (payload) => ipcRenderer.invoke("exercises:create", payload),
    update: (payload) => ipcRenderer.invoke("exercises:update", payload),
    delete: (id) => ipcRenderer.invoke("exercises:delete", id),
    search: (query) => ipcRenderer.invoke("exercises:search", query)
  },

  routines: {
    createFull: (payload) => ipcRenderer.invoke("routines:create-full", payload),
    updateFull: (payload) => ipcRenderer.invoke("routines:update-full", payload),
    delete: (id) => ipcRenderer.invoke("routines:delete", id),
    getByPatient: (patientId) => ipcRenderer.invoke("routines:get-by-patient", patientId)
  },

  diets: {
    createFull: (payload) => ipcRenderer.invoke("diets:create-full", payload),
    updateFull: (payload) => ipcRenderer.invoke("diets:update-full", payload),
    delete: (id) => ipcRenderer.invoke("diets:delete", id),
    getFull: (id) => ipcRenderer.invoke("diets:get-full", id),
    getByPatient: (patientId) => ipcRenderer.invoke("diets:get-by-patient", patientId)
  },

  foods: {
    getAll: () => ipcRenderer.invoke("foods:get-all"),
    getById: (id) => ipcRenderer.invoke("foods:get-by-id", id),
    create: (payload) => ipcRenderer.invoke("foods:create", payload),
    update: (payload) => ipcRenderer.invoke("foods:update", payload),
    delete: (id) => ipcRenderer.invoke("foods:delete", id),
    search: (query) => ipcRenderer.invoke("foods:search", query)
  },
  
  generatedDocuments: {
    save: (payload) => ipcRenderer.invoke("generated-documents:save", payload),
    open: (path) => ipcRenderer.invoke("generated-documents:open", path),
    delete: (id) => ipcRenderer.invoke("generated-documents:delete", id),
    saveDialog: (payload) => ipcRenderer.invoke("dialog:save-file", payload)
  },

  comparisons: {
    create: (payload) => ipcRenderer.invoke("comparisons:create", payload),
    getByPatient: (patientId) => ipcRenderer.invoke("comparisons:get-by-patient", patientId),
    delete: (id) => ipcRenderer.invoke("comparisons:delete", id)
  }
});