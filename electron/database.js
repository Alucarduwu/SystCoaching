const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// =========================
// PATHS
// =========================
const databaseDir = path.join(__dirname, "../database");

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const dbPath = path.join(databaseDir, "coaching.db");
const db = new Database(dbPath);

// =========================
// PRAGMAS
// =========================
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// NUCLEAR SCHEMA VERIFICATION
function verifySchema() {
  const tables = ['routines', 'routine_exercises'];
  tables.forEach(table => {
    try {
      const info = db.prepare(`PRAGMA table_info(${table})`).all();
      const cols = info.map(c => c.name);
      console.log(`[DB] Esquema ${table}:`, cols.join(', '));
      
      if (table === 'routines') {
        if (!cols.includes('semanas')) db.exec(`ALTER TABLE routines ADD COLUMN semanas INTEGER DEFAULT 1`);
        if (!cols.includes('frecuencia')) db.exec(`ALTER TABLE routines ADD COLUMN frecuencia INTEGER DEFAULT 5`);
      }
      if (table === 'routine_exercises') {
        if (!cols.includes('semana')) db.exec(`ALTER TABLE routine_exercises ADD COLUMN semana TEXT`);
        if (!cols.includes('dia')) db.exec(`ALTER TABLE routine_exercises ADD COLUMN dia TEXT`);
        if (!cols.includes('grupo_muscular_objetivo')) db.exec(`ALTER TABLE routine_exercises ADD COLUMN grupo_muscular_objetivo TEXT`);
        if (!cols.includes('sets_breakdown')) db.exec(`ALTER TABLE routine_exercises ADD COLUMN sets_breakdown TEXT`);
      }
    } catch (e) {
      console.error(`[DB] Error verificando esquema ${table}:`, e.message);
    }
  });
}
verifySchema();

// =========================
// SCHEMA
// =========================
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres TEXT NOT NULL,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT,
    fecha_nacimiento TEXT,
    edad INTEGER,
    email TEXT,
    telefono TEXT,
    sexo TEXT,
    estatura_cm REAL,
    objetivo TEXT,
    padecimientos TEXT,
    alergias TEXT,
    medicamentos TEXT,
    ocupacion TEXT,
    actividad_fisica TEXT,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patient_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    peso_kg REAL,
    imc REAL,
    masa_magra REAL,
    masa_muscular REAL,
    grasa_corporal REAL,
    fuerza REAL,
    cuello REAL,
    pierna_derecha REAL,
    pierna_izquierda REAL,
    cintura REAL,
    brazo_derecho REAL,
    brazo_izquierdo REAL,
    cadera REAL,
    pecho_espalda REAL,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS measurement_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measurement_id INTEGER NOT NULL,
    fecha TEXT,
    image_url TEXT NOT NULL,
    nota TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (measurement_id) REFERENCES patient_measurements(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS patient_custom_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measurement_id INTEGER NOT NULL,
    nombre_campo TEXT NOT NULL,
    valor REAL,
    unidad TEXT,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (measurement_id) REFERENCES patient_measurements(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    grupo_muscular TEXT,
    musculo_secundario TEXT,
    region TEXT,
    tipo_agarre TEXT,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    icono TEXT,
    categoria TEXT, -- Proteína, Carbohidrato, Grasa, Verdura, Fruta, Lácteo, Libre
    objetivo TEXT,
    calorias REAL NOT NULL DEFAULT 0, -- Por porción base
    proteina REAL NOT NULL DEFAULT 0,
    carbohidratos REAL NOT NULL DEFAULT 0,
    grasas REAL NOT NULL DEFAULT 0,
    fibra REAL NOT NULL DEFAULT 0,
    sodio REAL NOT NULL DEFAULT 0,
    azucar REAL NOT NULL DEFAULT 0,
    porcion_base REAL NOT NULL DEFAULT 100, -- Cantidad que define 1 equivalente
    unidad TEXT NOT NULL DEFAULT 'g', -- g, ml, pz
    es_libre INTEGER DEFAULT 0,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    semanas INTEGER DEFAULT 1,
    frecuencia INTEGER DEFAULT 5,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS routine_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    series INTEGER DEFAULT 0,
    repeticiones TEXT,
    descanso TEXT,
    peso_sugerido TEXT,
    notas TEXT,
    orden INTEGER NOT NULL DEFAULT 1,
    semana TEXT,
    dia TEXT,
    grupo_muscular_objetivo TEXT,
    sets_breakdown TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS diets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    objetivo TEXT,
    calorias_totales REAL DEFAULT 0,
    proteina_total REAL DEFAULT 0,
    carbohidratos_total REAL DEFAULT 0,
    grasas_total REAL DEFAULT 0,
    notas TEXT,
    activa INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS diet_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diet_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 1,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diet_id) REFERENCES diets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS diet_meal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    cantidad REAL NOT NULL, -- Gramos/Unidades reales ingresadas
    equivalentes REAL, -- Calculado automáticamente: cantidad / food.porcion_base
    unidad_personalizada TEXT,
    calorias REAL NOT NULL DEFAULT 0, -- Calculado: (cantidad/food.porcion_base) * food.calorias
    proteina REAL NOT NULL DEFAULT 0,
    carbohidratos REAL NOT NULL DEFAULT 0,
    grasas REAL NOT NULL DEFAULT 0,
    fibra REAL NOT NULL DEFAULT 0,
    sodio REAL NOT NULL DEFAULT 0,
    azucar REAL NOT NULL DEFAULT 0,
    notas TEXT,
    variante TEXT DEFAULT 'Opción 1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_id) REFERENCES diet_meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_patient_measurements_patient_id ON patient_measurements(patient_id);
  CREATE INDEX IF NOT EXISTS idx_measurement_photos_measurement_id ON measurement_photos(measurement_id);
  CREATE INDEX IF NOT EXISTS idx_patient_custom_measurements_measurement_id ON patient_custom_measurements(measurement_id);
  CREATE INDEX IF NOT EXISTS idx_diets_patient_id ON diets(patient_id);
  CREATE INDEX IF NOT EXISTS idx_diet_meals_diet_id ON diet_meals(diet_id);
  CREATE INDEX IF NOT EXISTS idx_diet_meal_items_meal_id ON diet_meal_items(meal_id);
  CREATE INDEX IF NOT EXISTS idx_diet_meal_items_food_id ON diet_meal_items(food_id);
  CREATE INDEX IF NOT EXISTS idx_routines_patient_id ON routines(patient_id);
  CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
  CREATE TABLE IF NOT EXISTS generated_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT, -- 'pdf_progress', 'pdf_diet', 'pdf_routine'
    file_path TEXT NOT NULL,
    metadata TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_generated_documents_patient_id ON generated_documents(patient_id);
  
  CREATE TABLE IF NOT EXISTS patient_comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    initial_id INTEGER,
    final_id INTEGER,
    sections TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_patient_comparisons_patient_id ON patient_comparisons(patient_id);
`);

try {
  db.exec(`ALTER TABLE patient_measurements ADD COLUMN fuerza_brazo_derecho REAL`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE patient_measurements ADD COLUMN fuerza_brazo_izquierdo REAL`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE patient_measurements ADD COLUMN pantorrilla_derecha REAL`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE patient_measurements ADD COLUMN pantorrilla_izquierda REAL`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE patient_measurements ADD COLUMN grasa_corporal REAL`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE exercises ADD COLUMN musculo_secundario TEXT`);
  db.exec(`ALTER TABLE exercises ADD COLUMN tipo_agarre TEXT`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE foods ADD COLUMN objetivo TEXT`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE foods ADD COLUMN azucar REAL NOT NULL DEFAULT 0`);
} catch (_) {}

try {
  db.exec(`ALTER TABLE exercises ADD COLUMN region TEXT`);
} catch (_) {}

try { db.exec(`ALTER TABLE foods ADD COLUMN es_libre INTEGER DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE diet_meal_items ADD COLUMN equivalentes REAL`); } catch (_) {}
try { db.exec(`ALTER TABLE diet_meal_items ADD COLUMN fibra REAL DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE diet_meal_items ADD COLUMN sodio REAL DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE diet_meal_items ADD COLUMN azucar REAL DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE diet_meal_items ADD COLUMN variante TEXT DEFAULT 'Opción 1'`); } catch (_) {}

// =========================
// HELPERS
// =========================
function toNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function toNullableText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizePatientPayload(patient = {}) {
  return {
    id: patient.id ? Number(patient.id) : undefined,
    nombres: String(patient.nombres || "").trim(),
    apellido_paterno: String(patient.apellido_paterno || "").trim(),
    apellido_materno: toNullableText(patient.apellido_materno),
    fecha_nacimiento: toNullableText(patient.fecha_nacimiento),
    edad:
      patient.edad === null || patient.edad === undefined || patient.edad === ""
        ? null
        : Number(patient.edad),
    email: toNullableText(patient.email),
    telefono: toNullableText(patient.telefono),
    sexo: toNullableText(patient.sexo),
    estatura_cm:
      patient.estatura_cm === null ||
      patient.estatura_cm === undefined ||
      patient.estatura_cm === ""
        ? null
        : Number(patient.estatura_cm),
    objetivo: toNullableText(patient.objetivo),
    padecimientos: toNullableText(patient.padecimientos),
    alergias: toNullableText(patient.alergias),
    medicamentos: toNullableText(patient.medicamentos),
    ocupacion: toNullableText(patient.ocupacion),
    actividad_fisica: toNullableText(patient.actividad_fisica),
    notas: toNullableText(patient.notas)
  };
}

function validatePatientPayload(patient) {
  if (!patient.nombres) {
    throw new Error("Los nombres del paciente son obligatorios.");
  }

  if (!patient.apellido_paterno) {
    throw new Error("El apellido paterno es obligatorio.");
  }

  if (patient.edad !== null && Number.isNaN(patient.edad)) {
    throw new Error("La edad debe ser numérica.");
  }

  if (patient.estatura_cm !== null && Number.isNaN(patient.estatura_cm)) {
    throw new Error("La estatura debe ser numérica.");
  }
}

function normalizeMeasurementPayload(measurement = {}) {
  return {
    id: measurement.id ? Number(measurement.id) : undefined,
    patient_id: Number(measurement.patient_id),
    fecha: toNullableText(measurement.fecha),

    peso_kg: measurement.peso_kg === "" ? null : Number(measurement.peso_kg),
    imc: measurement.imc === "" ? null : Number(measurement.imc),
    masa_magra: measurement.masa_magra === "" ? null : Number(measurement.masa_magra),
    masa_muscular: measurement.masa_muscular === "" ? null : Number(measurement.masa_muscular),
    grasa_corporal: measurement.grasa_corporal === "" ? null : Number(measurement.grasa_corporal),

    fuerza: measurement.fuerza === "" ? null : Number(measurement.fuerza),
    fuerza_brazo_derecho: measurement.fuerza_brazo_derecho === "" ? null : Number(measurement.fuerza_brazo_derecho),
    fuerza_brazo_izquierdo: measurement.fuerza_brazo_izquierdo === "" ? null : Number(measurement.fuerza_brazo_izquierdo),

    cuello: measurement.cuello === "" ? null : Number(measurement.cuello),
    pierna_derecha: measurement.pierna_derecha === "" ? null : Number(measurement.pierna_derecha),
    pierna_izquierda: measurement.pierna_izquierda === "" ? null : Number(measurement.pierna_izquierda),
    pantorrilla_derecha: measurement.pantorrilla_derecha === "" ? null : Number(measurement.pantorrilla_derecha),
    pantorrilla_izquierda: measurement.pantorrilla_izquierda === "" ? null : Number(measurement.pantorrilla_izquierda),
    cintura: measurement.cintura === "" ? null : Number(measurement.cintura),
    brazo_derecho: measurement.brazo_derecho === "" ? null : Number(measurement.brazo_derecho),
    brazo_izquierdo: measurement.brazo_izquierdo === "" ? null : Number(measurement.brazo_izquierdo),
    cadera: measurement.cadera === "" ? null : Number(measurement.cadera),
    pecho_espalda: measurement.pecho_espalda === "" ? null : Number(measurement.pecho_espalda),

    notas: toNullableText(measurement.notas)
  };
}

function validateMeasurementPayload(measurement) {
  if (!measurement.patient_id || Number.isNaN(measurement.patient_id)) {
    throw new Error("El patient_id es obligatorio.");
  }

  const numericFields = [
    "peso_kg",
    "imc",
    "masa_magra",
    "masa_muscular",
    "grasa_corporal",
    "fuerza",
    "fuerza_brazo_derecho",
    "fuerza_brazo_izquierdo",
    "cuello",
    "pierna_derecha",
    "pierna_izquierda",
    "pantorrilla_derecha",
    "pantorrilla_izquierda",
    "cintura",
    "brazo_derecho",
    "brazo_izquierdo",
    "cadera",
    "pecho_espalda"
  ];

  for (const field of numericFields) {
    if (measurement[field] !== null && Number.isNaN(measurement[field])) {
      throw new Error(`El campo "${field}" debe ser numérico.`);
    }
  }
}

function normalizeMeasurementPhotoPayload(photo = {}) {
  return {
    id: photo.id ? Number(photo.id) : undefined,
    measurement_id: Number(photo.measurement_id),
    fecha: toNullableText(photo.fecha),
    image_url: toNullableText(photo.image_url),
    nota: toNullableText(photo.nota)
  };
}

function validateMeasurementPhotoPayload(photo) {
  if (!photo.measurement_id || Number.isNaN(photo.measurement_id)) {
    throw new Error("El measurement_id es obligatorio.");
  }

  if (!photo.image_url) {
    throw new Error("La image_url de la foto es obligatoria.");
  }
}

function normalizeCustomMeasurementPayload(item = {}) {
  return {
    id: item.id ? Number(item.id) : undefined,
    measurement_id: Number(item.measurement_id),
    nombre_campo: String(item.nombre_campo || "").trim(),
    valor:
      item.valor === null || item.valor === undefined || item.valor === ""
        ? null
        : Number(item.valor),
    unidad: toNullableText(item.unidad),
    notas: toNullableText(item.notas)
  };
}

function validateCustomMeasurementPayload(item) {
  if (!item.measurement_id || Number.isNaN(item.measurement_id)) {
    throw new Error("El measurement_id es obligatorio.");
  }

  if (!item.nombre_campo) {
    throw new Error("El nombre del campo personalizado es obligatorio.");
  }

  if (item.valor !== null && Number.isNaN(item.valor)) {
    throw new Error("El valor de la medición personalizada debe ser numérico.");
  }
}

function normalizeExercisePayload(exe = {}) {
  return {
    id: exe.id ? Number(exe.id) : undefined,
    nombre: String(exe.nombre || "").trim(),
    grupo_muscular: toNullableText(exe.grupo_muscular),
    musculo_secundario: toNullableText(exe.musculo_secundario),
    region: toNullableText(exe.region),
    tipo_agarre: toNullableText(exe.tipo_agarre),
    notas: toNullableText(exe.notas)
  };
}

function validateExercisePayload(exe) {
  if (!exe.nombre) {
    throw new Error("El nombre del ejercicio es obligatorio.");
  }
}

function normalizeRoutinePayload(routine = {}) {
  return {
    id: routine.id ? Number(routine.id) : undefined,
    patient_id: Number(routine.patient_id),
    nombre: String(routine.nombre || "").trim(),
    semanas: toNumber(routine.semanas, 1),
    frecuencia: toNumber(routine.frecuencia, 5),
    notas: toNullableText(routine.notas)
  };
}

function validateRoutinePayload(routine) {
  if (!routine.patient_id || Number.isNaN(routine.patient_id)) {
    throw new Error("El patient_id de la rutina es obligatorio.");
  }
  if (!routine.nombre) {
    throw new Error("El nombre de la rutina es obligatorio.");
  }
}

function normalizeRoutineExercisePayload(re = {}) {
  return {
    id: re.id ? Number(re.id) : undefined,
    routine_id: Number(re.routine_id),
    exercise_id: Number(re.exercise_id),
    series: toNumber(re.series, 0),
    repeticiones: toNullableText(re.repeticiones),
    descanso: toNullableText(re.descanso),
    peso_sugerido: toNullableText(re.peso_sugerido),
    notas: toNullableText(re.notas),
    orden: toNumber(re.orden, 1),
    semana: toNullableText(re.semana),
    dia: toNullableText(re.dia),
    grupo_muscular_objetivo: toNullableText(re.grupo_muscular_objetivo),
    sets_breakdown: re.sets_breakdown ? (typeof re.sets_breakdown === 'string' ? re.sets_breakdown : JSON.stringify(re.sets_breakdown)) : null
  };
}

function validateRoutineExercisePayload(re) {
  if (!re.routine_id || Number.isNaN(re.routine_id)) {
    throw new Error("El routine_id es obligatorio.");
  }
  if (!re.exercise_id || Number.isNaN(re.exercise_id)) {
    throw new Error("El exercise_id es obligatorio.");
  }
  if (Number.isNaN(re.series) || re.series < 0) {
    throw new Error("Las series deben ser un número no negativo.");
  }
  if (Number.isNaN(re.orden) || re.orden < 1) {
    throw new Error("El orden debe ser un número positivo.");
  }
}

function normalizeFoodPayload(food = {}) {
  return {
    id: food.id ? Number(food.id) : undefined,
    nombre: String(food.nombre || "").trim(),
    icono: toNullableText(food.icono),
    categoria: toNullableText(food.categoria),
    objetivo: toNullableText(food.objetivo),

    calorias: toNumber(food.kcal_100g ?? food.calorias, 0),
    proteina: toNumber(food.proteina_100g ?? food.proteina, 0),
    carbohidratos: toNumber(food.carbohidratos_100g ?? food.carbohidratos, 0),
    grasas: toNumber(food.grasas_100g ?? food.grasas, 0),
    fibra: toNumber(food.fibra_100g ?? food.fibra, 0),
    sodio: toNumber(food.sodio_100g ?? food.sodio, 0),
    azucar: toNumber(food.azucar_100g ?? food.azucar, 0),

    porcion_base: toNumber(food.porcion_base_g ?? food.porcion_base, 100),
    unidad: String(food.unidad || "g").trim(),

    notas: toNullableText(food.notas)
  };
}

function validateFoodPayload(food) {
  if (!food.nombre) {
    throw new Error("El nombre del alimento es obligatorio.");
  }

  const numericFields = [
    "calorias",
    "proteina",
    "carbohidratos",
    "grasas",
    "fibra",
    "sodio",
    "azucar",
    "porcion_base"
  ];

  for (const field of numericFields) {
    if (Number.isNaN(food[field])) {
      throw new Error(`El campo "${field}" debe ser numérico.`);
    }
  }

  if (food.porcion_base <= 0) {
    throw new Error("La porción base debe ser mayor a 0.");
  }
}

function normalizeDietPayload(diet = {}) {
  return {
    id: diet.id ? Number(diet.id) : undefined,
    patient_id: Number(diet.patient_id),
    nombre: String(diet.nombre || "").trim(),
    objetivo: toNullableText(diet.objetivo),
    calorias_totales: toNumber(diet.calorias_totales, 0),
    proteina_total: toNumber(diet.proteina_total, 0),
    carbohidratos_total: toNumber(diet.carbohidratos_total, 0),
    grasas_total: toNumber(diet.grasas_total, 0),
    notas: toNullableText(diet.notas),
    activa: diet.activa === undefined ? 1 : Number(diet.activa ? 1 : 0)
  };
}

function validateDietPayload(diet) {
  if (!diet.patient_id || Number.isNaN(diet.patient_id)) {
    throw new Error("El patient_id de la dieta es obligatorio.");
  }

  if (!diet.nombre) {
    throw new Error("El nombre de la dieta es obligatorio.");
  }
}

function normalizeMealPayload(meal = {}) {
  return {
    id: meal.id ? Number(meal.id) : undefined,
    diet_id: Number(meal.diet_id),
    nombre: String(meal.nombre || "").trim(),
    orden: toNumber(meal.orden, 1),
    notas: toNullableText(meal.notas)
  };
}

function validateMealPayload(meal) {
  if (!meal.diet_id || Number.isNaN(meal.diet_id)) {
    throw new Error("El diet_id es obligatorio.");
  }

  if (!meal.nombre) {
    throw new Error("El nombre de la comida es obligatorio.");
  }
}

function calculateMacrosFromFood(food, cantidad) {
  const porcion_base = toNumber(food.porcion_base, 100) || 100;
  const factor = cantidad / porcion_base;

  return {
    calorias: Number((toNumber(food.calorias) * factor).toFixed(2)),
    proteina: Number((toNumber(food.proteina) * factor).toFixed(2)),
    carbohidratos: Number((toNumber(food.carbohidratos) * factor).toFixed(2)),
    grasas: Number((toNumber(food.grasas) * factor).toFixed(2)),
    fibra: Number((toNumber(food.fibra) * factor).toFixed(2)),
    sodio: Number((toNumber(food.sodio) * factor).toFixed(2)),
    azucar: Number((toNumber(food.azucar) * factor).toFixed(2)),
    equivalentes: Number(factor.toFixed(2))
  };
}

function normalizeMealItemPayload(item = {}) {
  return {
    id: item.id ? Number(item.id) : undefined,
    meal_id: Number(item.meal_id),
    food_id: Number(item.food_id),
    cantidad: toNumber(item.cantidad, 1),
    unidad_personalizada: toNullableText(item.unidad_personalizada),
    notas: toNullableText(item.notas)
  };
}

function validateMealItemPayload(item) {
  if (!item.meal_id || Number.isNaN(item.meal_id)) {
    throw new Error("El meal_id es obligatorio.");
  }

  if (!item.food_id || Number.isNaN(item.food_id)) {
    throw new Error("El food_id es obligatorio.");
  }

  if (Number.isNaN(item.cantidad) || item.cantidad <= 0) {
    throw new Error("La cantidad debe ser mayor a 0.");
  }
}

// =========================
// PREPARED STATEMENTS
// =========================
const statements = {
  patients: {
    create: db.prepare(`
      INSERT INTO patients (
        nombres, apellido_paterno, apellido_materno, fecha_nacimiento, edad,
        email, telefono, sexo, estatura_cm, objetivo,
        padecimientos, alergias, medicamentos, ocupacion, actividad_fisica, notas
      ) VALUES (
        @nombres, @apellido_paterno, @apellido_materno, @fecha_nacimiento, @edad,
        @email, @telefono, @sexo, @estatura_cm, @objetivo,
        @padecimientos, @alergias, @medicamentos, @ocupacion, @actividad_fisica, @notas
      )
    `),

    getAll: db.prepare(`
      SELECT p.*, 
        (SELECT peso_kg FROM patient_measurements WHERE patient_id = p.id AND peso_kg > 0 
         ORDER BY COALESCE(NULLIF(fecha, ''), created_at) DESC, id DESC LIMIT 1) as peso_actual,
        (SELECT COUNT(*) FROM diets WHERE patient_id = p.id) > 0 as has_diet,
        (SELECT COUNT(*) FROM routines WHERE patient_id = p.id) > 0 as has_routine
      FROM patients p
      ORDER BY p.created_at DESC
    `),

    getById: db.prepare(`
      SELECT *
      FROM patients
      WHERE id = ?
    `),

    update: db.prepare(`
      UPDATE patients
      SET
        nombres = @nombres,
        apellido_paterno = @apellido_paterno,
        apellido_materno = @apellido_materno,
        fecha_nacimiento = @fecha_nacimiento,
        edad = @edad,
        email = @email,
        telefono = @telefono,
        sexo = @sexo,
        estatura_cm = @estatura_cm,
        objetivo = @objetivo,
        padecimientos = @padecimientos,
        alergias = @alergias,
        medicamentos = @medicamentos,
        ocupacion = @ocupacion,
        actividad_fisica = @actividad_fisica,
        notas = @notas,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM patients
      WHERE id = ?
    `)
  },

  measurements: {
    create: db.prepare(`
      INSERT INTO patient_measurements (
        patient_id, fecha,
        peso_kg, imc, masa_magra, masa_muscular, grasa_corporal,
        fuerza, fuerza_brazo_derecho, fuerza_brazo_izquierdo,
        cuello, pierna_derecha, pierna_izquierda, pantorrilla_derecha, pantorrilla_izquierda,
        cintura, brazo_derecho, brazo_izquierdo, cadera, pecho_espalda,
        notas
      ) VALUES (
        @patient_id, COALESCE(@fecha, CURRENT_TIMESTAMP),
        @peso_kg, @imc, @masa_magra, @masa_muscular, @grasa_corporal,
        @fuerza, @fuerza_brazo_derecho, @fuerza_brazo_izquierdo,
        @cuello, @pierna_derecha, @pierna_izquierda, @pantorrilla_derecha, @pantorrilla_izquierda,
        @cintura, @brazo_derecho, @brazo_izquierdo, @cadera, @pecho_espalda,
        @notas
      )
    `),

    getById: db.prepare(`
      SELECT *
      FROM patient_measurements
      WHERE id = ?
    `),

    getByPatientId: db.prepare(`
      SELECT *
      FROM patient_measurements
      WHERE patient_id = ?
      ORDER BY datetime(fecha) DESC, id DESC
    `),

    update: db.prepare(`
      UPDATE patient_measurements
      SET
        fecha = COALESCE(@fecha, fecha),
        peso_kg = @peso_kg,
        imc = @imc,
        masa_magra = @masa_magra,
        masa_muscular = @masa_muscular,
        grasa_corporal = @grasa_corporal,
        fuerza = @fuerza,
        fuerza_brazo_derecho = @fuerza_brazo_derecho,
        fuerza_brazo_izquierdo = @fuerza_brazo_izquierdo,
        cuello = @cuello,
        pierna_derecha = @pierna_derecha,
        pierna_izquierda = @pierna_izquierda,
        pantorrilla_derecha = @pantorrilla_derecha,
        pantorrilla_izquierda = @pantorrilla_izquierda,
        cintura = @cintura,
        brazo_derecho = @brazo_derecho,
        brazo_izquierdo = @brazo_izquierdo,
        cadera = @cadera,
        pecho_espalda = @pecho_espalda,
        notas = @notas,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM patient_measurements
      WHERE id = ?
    `)
  },

  measurementPhotos: {
    create: db.prepare(`
      INSERT INTO measurement_photos (
        measurement_id, fecha, image_url, nota
      ) VALUES (
        @measurement_id, @fecha, @image_url, @nota
      )
    `),

    getById: db.prepare(`
      SELECT *
      FROM measurement_photos
      WHERE id = ?
    `),

    getByMeasurementId: db.prepare(`
      SELECT *
      FROM measurement_photos
      WHERE measurement_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
    `),

    delete: db.prepare(`
      DELETE FROM measurement_photos
      WHERE id = ?
    `)
  },

  customMeasurements: {
    create: db.prepare(`
      INSERT INTO patient_custom_measurements (
        measurement_id, nombre_campo, valor, unidad, notas
      ) VALUES (
        @measurement_id, @nombre_campo, @valor, @unidad, @notas
      )
    `),

    getByMeasurementId: db.prepare(`
      SELECT *
      FROM patient_custom_measurements
      WHERE measurement_id = ?
      ORDER BY id ASC
    `),

    getById: db.prepare(`
      SELECT *
      FROM patient_custom_measurements
      WHERE id = ?
    `),

    update: db.prepare(`
      UPDATE patient_custom_measurements
      SET
        nombre_campo = @nombre_campo,
        valor = @valor,
        unidad = @unidad,
        notas = @notas,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM patient_custom_measurements
      WHERE id = ?
    `)
  },

  st_exercises: {
    create: db.prepare(`
      INSERT INTO exercises (
        nombre, grupo_muscular, musculo_secundario, region, tipo_agarre, notas
      ) VALUES (
        @nombre, @grupo_muscular, @musculo_secundario, @region, @tipo_agarre, @notas
      )
    `),
    getAll: db.prepare(`
      SELECT * FROM exercises ORDER BY nombre ASC
    `),
    getById: db.prepare(`
      SELECT * FROM exercises WHERE id = ?
    `),
    getByIdCached: db.prepare(`
      SELECT * FROM exercises WHERE id = ?
    `),
    update: db.prepare(`
      UPDATE exercises
      SET nombre = @nombre,
          grupo_muscular = @grupo_muscular,
          musculo_secundario = @musculo_secundario,
          region = @region,
          tipo_agarre = @tipo_agarre,
          notas = @notas,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),
    delete: db.prepare(`
      DELETE FROM exercises WHERE id = ?
    `),
    search: db.prepare(`
      SELECT * FROM exercises 
      WHERE nombre LIKE ? OR grupo_muscular LIKE ? OR region LIKE ?
      ORDER BY nombre ASC LIMIT 50
    `)
  },

  routines: {
    create: db.prepare(`
      INSERT INTO routines (patient_id, nombre, semanas, frecuencia, notas)
      VALUES (@patient_id, @nombre, @semanas, @frecuencia, @notas)
    `),
    getByPatientId: db.prepare(`
      SELECT * FROM routines WHERE patient_id = ? ORDER BY created_at DESC
    `),
    getById: db.prepare(`
      SELECT * FROM routines WHERE id = ?
    `),
    update: db.prepare(`
      UPDATE routines 
      SET nombre = @nombre, semanas = @semanas, frecuencia = @frecuencia, notas = @notas, updated_at = CURRENT_TIMESTAMP 
      WHERE id = @id
    `),
    delete: db.prepare(`
      DELETE FROM routines WHERE id = ?
    `)
  },

  routineExercises: {
    add: db.prepare(`
      INSERT INTO routine_exercises (
        routine_id, exercise_id, series, repeticiones, descanso, peso_sugerido, notas, orden,
        semana, dia, grupo_muscular_objetivo, sets_breakdown
      )
      VALUES (
        @routine_id, @exercise_id, @series, @repeticiones, @descanso, @peso_sugerido, @notas, @orden,
        @semana, @dia, @grupo_muscular_objetivo, @sets_breakdown
      )
    `),
    getByRoutineId: db.prepare(`
      SELECT re.*, e.nombre as exercise_nombre, e.grupo_muscular
      FROM routine_exercises re
      JOIN exercises e ON e.id = re.exercise_id
      WHERE re.routine_id = ?
      ORDER BY re.orden ASC, re.id ASC
    `),
    getById: db.prepare(`
      SELECT re.*, e.nombre as exercise_nombre, e.grupo_muscular
      FROM routine_exercises re
      JOIN exercises e ON e.id = re.exercise_id
      WHERE re.id = ?
    `),
    update: db.prepare(`
      UPDATE routine_exercises
      SET exercise_id = @exercise_id, series = @series, repeticiones = @repeticiones, descanso = @descanso, 
          peso_sugerido = @peso_sugerido, notas = @notas, orden = @orden,
          semana = @semana, dia = @dia, grupo_muscular_objetivo = @grupo_muscular_objetivo, sets_breakdown = @sets_breakdown,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),
    delete: db.prepare(`
      DELETE FROM routine_exercises WHERE id = ?
    `)
  },

  foods: {
    create: db.prepare(`
      INSERT INTO foods (
        nombre, icono, categoria, objetivo,
        calorias, proteina, carbohidratos, grasas,
        fibra, sodio, azucar,
        porcion_base, unidad, notas
      ) VALUES (
        @nombre, @icono, @categoria, @objetivo,
        @calorias, @proteina, @carbohidratos, @grasas,
        @fibra, @sodio, @azucar,
        @porcion_base, @unidad, @notas
      )
    `),

    getAll: db.prepare(`
      SELECT *
      FROM foods
      ORDER BY nombre ASC
    `),

    getById: db.prepare(`
      SELECT *
      FROM foods
      WHERE id = ?
    `),

    update: db.prepare(`
      UPDATE foods
      SET
        nombre = @nombre,
        icono = @icono,
        categoria = @categoria,
        objetivo = @objetivo,
        calorias = @calorias,
        proteina = @proteina,
        carbohidratos = @carbohidratos,
        grasas = @grasas,
        fibra = @fibra,
        sodio = @sodio,
        azucar = @azucar,
        porcion_base = @porcion_base,
        unidad = @unidad,
        notas = @notas,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM foods
      WHERE id = ?
    `),
    search: db.prepare(`
      SELECT * FROM foods
      WHERE nombre LIKE ? OR categoria LIKE ?
      ORDER BY nombre ASC LIMIT 50
    `)
  },

  diets: {
    create: db.prepare(`
      INSERT INTO diets (
        patient_id, nombre, objetivo, calorias_totales,
        proteina_total, carbohidratos_total, grasas_total, notas, activa
      ) VALUES (
        @patient_id, @nombre, @objetivo, @calorias_totales,
        @proteina_total, @carbohidratos_total, @grasas_total, @notas, @activa
      )
    `),

    getAllByPatientId: db.prepare(`
      SELECT *
      FROM diets
      WHERE patient_id = ?
      ORDER BY created_at DESC
    `),

    getById: db.prepare(`
      SELECT *
      FROM diets
      WHERE id = ?
    `),

    update: db.prepare(`
      UPDATE diets
      SET
        nombre = @nombre,
        objetivo = @objetivo,
        calorias_totales = @calorias_totales,
        proteina_total = @proteina_total,
        carbohidratos_total = @carbohidratos_total,
        grasas_total = @grasas_total,
        notas = @notas,
        activa = @activa,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM diets
      WHERE id = ?
    `)
  },

  dietMeals: {
    create: db.prepare(`
      INSERT INTO diet_meals (
        diet_id, nombre, orden, notas
      ) VALUES (
        @diet_id, @nombre, @orden, @notas
      )
    `),

    getByDietId: db.prepare(`
      SELECT *
      FROM diet_meals
      WHERE diet_id = ?
      ORDER BY orden ASC, id ASC
    `),

    getById: db.prepare(`
      SELECT *
      FROM diet_meals
      WHERE id = ?
    `),

    update: db.prepare(`
      UPDATE diet_meals
      SET
        nombre = @nombre,
        orden = @orden,
        notas = @notas,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM diet_meals
      WHERE id = ?
    `)
  },

  dietMealItems: {
    create: db.prepare(`
      INSERT INTO diet_meal_items (
        meal_id, food_id, cantidad, unidad_personalizada,
        calorias, proteina, carbohidratos, grasas, fibra, sodio, azucar,
        notas, variante
      ) VALUES (
        @meal_id, @food_id, @cantidad, @unidad_personalizada,
        @calorias, @proteina, @carbohidratos, @grasas, @fibra, @sodio, @azucar,
        @notas, @variante
      )
    `),

    getByMealId: db.prepare(`
      SELECT
        dmi.*,
        f.nombre AS food_nombre,
        f.categoria AS food_categoria,
        f.porcion_base AS food_porcion_base,
        f.unidad AS food_unidad,
        f.calorias AS food_kcal,
        f.proteina AS food_proteina,
        f.carbohidratos AS food_carbohidratos,
        f.grasas AS food_grasas,
        f.fibra AS food_fibra,
        f.sodio AS food_sodio,
        f.azucar AS food_azucar
      FROM diet_meal_items dmi
      INNER JOIN foods f ON f.id = dmi.food_id
      WHERE dmi.meal_id = ?
      ORDER BY dmi.id ASC
    `),

    getById: db.prepare(`
      SELECT *
      FROM diet_meal_items
      WHERE id = ?
    `),

    update: db.prepare(`
      UPDATE diet_meal_items
      SET
        food_id = @food_id,
        cantidad = @cantidad,
        unidad_personalizada = @unidad_personalizada,
        calorias = @calorias,
        proteina = @proteina,
        carbohidratos = @carbohidratos,
        grasas = @grasas,
        fibra = @fibra,
        sodio = @sodio,
        azucar = @azucar,
        notas = @notas,
        variante = @variante,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `),

    delete: db.prepare(`
      DELETE FROM diet_meal_items
      WHERE id = ?
    `)
  },

  generatedDocuments: {
    create: db.prepare(`
      INSERT INTO generated_documents (patient_id, nombre, tipo, file_path, metadata)
      VALUES (@patient_id, @nombre, @tipo, @file_path, @metadata)
    `),
    getByPatientId: db.prepare(`
      SELECT * FROM generated_documents WHERE patient_id = ? ORDER BY created_at DESC
    `),
    delete: db.prepare(`
      DELETE FROM generated_documents WHERE id = ?
    `)
  },

  patientComparisons: {
    create: db.prepare(`
      INSERT INTO patient_comparisons (patient_id, title, initial_id, final_id, sections)
      VALUES (@patient_id, @title, @initial_id, @final_id, @sections)
    `),
    getByPatientId: db.prepare(`
      SELECT * FROM patient_comparisons WHERE patient_id = ? ORDER BY created_at DESC
    `),
    delete: db.prepare(`
      DELETE FROM patient_comparisons WHERE id = ?
    `)
  }
};

// =========================
// DATABASE API
// =========================
const database = {
  db,
  dbPath,

  init() {
    return {
      ok: true,
      message: "Base de datos inicializada correctamente.",
      dbPath
    };
  },

  patient: {
    create(data) {
      const payload = normalizePatientPayload(data);
      validatePatientPayload(payload);

      const result = statements.patients.create.run(payload);
      return statements.patients.getById.get(result.lastInsertRowid);
    },

    getAll() {
      return statements.patients.getAll.all();
    },

    getById(id) {
      return statements.patients.getById.get(Number(id)) || null;
    },

    update(data) {
      const payload = normalizePatientPayload(data);

      if (!payload.id) {
        throw new Error("El id del paciente es obligatorio para actualizar.");
      }

      validatePatientPayload(payload);

      const result = statements.patients.update.run(payload);

      if (result.changes === 0) {
        throw new Error("No se encontró el paciente a actualizar.");
      }

      return statements.patients.getById.get(payload.id);
    },

    delete(id) {
      const patientId = Number(id);
      const existing = statements.patients.getById.get(patientId);

      if (!existing) {
        throw new Error("No se encontró el paciente a eliminar.");
      }

      const result = statements.patients.delete.run(patientId);

      return {
        ok: result.changes > 0,
        deletedId: patientId
      };
    }
  },

  measurement: {
    create(data) {
      const payload = normalizeMeasurementPayload(data);
      validateMeasurementPayload(payload);

      const result = statements.measurements.create.run(payload);
      return statements.measurements.getById.get(result.lastInsertRowid);
    },

    getById(id) {
      return statements.measurements.getById.get(Number(id)) || null;
    },

    getByPatientId(patientId) {
      return statements.measurements.getByPatientId.all(Number(patientId));
    },

    update(data) {
      const payload = normalizeMeasurementPayload(data);

      if (!payload.id) {
        throw new Error("El id de la medición es obligatorio para actualizar.");
      }

      validateMeasurementPayload(payload);

      const result = statements.measurements.update.run(payload);

      if (result.changes === 0) {
        throw new Error("No se encontró la medición a actualizar.");
      }

      return statements.measurements.getById.get(payload.id);
    },

    delete(id) {
      const measurementId = Number(id);
      const existing = statements.measurements.getById.get(measurementId);

      if (!existing) {
        throw new Error("No se encontró la medición a eliminar.");
      }

      const result = statements.measurements.delete.run(measurementId);

      return {
        ok: result.changes > 0,
        deletedId: measurementId
      };
    }
  },

  measurementPhoto: {
    create(data) {
      const payload = normalizeMeasurementPhotoPayload(data);
      validateMeasurementPhotoPayload(payload);

      const result = statements.measurementPhotos.create.run(payload);
      return statements.measurementPhotos.getById.get(result.lastInsertRowid);
    },

    getById(id) {
      return statements.measurementPhotos.getById.get(Number(id)) || null;
    },

    getByMeasurementId(measurementId) {
      return statements.measurementPhotos.getByMeasurementId.all(Number(measurementId));
    },

    delete(id) {
      const photoId = Number(id);
      const existing = statements.measurementPhotos.getById.get(photoId);

      if (!existing) {
        throw new Error("No se encontró la foto a eliminar.");
      }

      const result = statements.measurementPhotos.delete.run(photoId);

      return {
        ok: result.changes > 0,
        deletedId: photoId,
        image_url: existing.image_url
      };
    }
  },

  customMeasurement: {
    create(data) {
      const payload = normalizeCustomMeasurementPayload(data);
      validateCustomMeasurementPayload(payload);

      const result = statements.customMeasurements.create.run(payload);
      return statements.customMeasurements.getById.get(result.lastInsertRowid);
    },

    getByMeasurementId(measurementId) {
      return statements.customMeasurements.getByMeasurementId.all(Number(measurementId));
    },

    getById(id) {
      return statements.customMeasurements.getById.get(Number(id)) || null;
    },

    update(data) {
      const payload = normalizeCustomMeasurementPayload(data);

      if (!payload.id) {
        throw new Error("El id de la medición personalizada es obligatorio para actualizar.");
      }

      validateCustomMeasurementPayload(payload);

      const result = statements.customMeasurements.update.run(payload);

      if (result.changes === 0) {
        throw new Error("No se encontró la medición personalizada a actualizar.");
      }

      return statements.customMeasurements.getById.get(payload.id);
    },

    delete(id) {
      const customId = Number(id);
      const existing = statements.customMeasurements.getById.get(customId);

      if (!existing) {
        throw new Error("No se encontró la medición personalizada a eliminar.");
      }

      const result = statements.customMeasurements.delete.run(customId);

      return {
        ok: result.changes > 0,
        deletedId: customId
      };
    }
  },

  exercise: {
    create(data) {
      const payload = normalizeExercisePayload(data);
      validateExercisePayload(payload);
      const res = statements.st_exercises.create.run({
        nombre: payload.nombre,
        grupo_muscular: payload.grupo_muscular,
        musculo_secundario: payload.musculo_secundario,
        region: payload.region,
        tipo_agarre: payload.tipo_agarre,
        notas: payload.notas
      });
      return statements.st_exercises.getById.get(res.lastInsertRowid);
    },
    getAll() {
      return statements.st_exercises.getAll.all();
    },
    getById(id) {
      return statements.st_exercises.getById.get(Number(id)) || null;
    },
    update(data) {
      console.log('Database: Intentando actualizar ejercicio:', data);
      const payload = normalizeExercisePayload(data);
      if (!payload.id) throw new Error("ID obligatorio para actualización.");
      validateExercisePayload(payload);
      
      const res = statements.st_exercises.update.run({
        id: payload.id,
        nombre: payload.nombre,
        grupo_muscular: payload.grupo_muscular,
        musculo_secundario: payload.musculo_secundario,
        region: payload.region,
        tipo_agarre: payload.tipo_agarre,
        notas: payload.notas
      });
      
      console.log('Database: Resultado update ejercicios:', res);
      if (res.changes === 0) throw new Error("Ejercicio no encontrado en la base de datos.");
      return statements.st_exercises.getById.get(payload.id);
    },
    delete(id) {
      const eid = Number(id);
      const res = statements.st_exercises.delete.run(eid);
      return { ok: res.changes > 0, deletedId: eid };
    }
  },

  measurementWithCustomFields(measurementId) {
    const measurement = statements.measurements.getById.get(Number(measurementId));
    if (!measurement) return null;

    const customFields = statements.customMeasurements.getByMeasurementId.all(Number(measurementId));
    const fotos = statements.measurementPhotos.getByMeasurementId.all(Number(measurementId));

    return {
      measurement,
      customFields,
      fotos
    };
  },

  dietFull(dietId) {
    const diet = statements.diets.getById.get(Number(dietId));
    if (!diet) return null;

    const meals = statements.dietMeals.getByDietId.all(Number(dietId)).map((meal) => {
      const items = statements.dietMealItems.getByMealId.all(meal.id);
      
      // Calculate totals based on the FIRST variant found (to avoid summing variants)
      const firstVariant = items.length > 0 ? items[0].variante : 'Opción 1';
      const baselineItems = items.filter(i => i.variante === firstVariant);

      const totals = baselineItems.reduce(
        (acc, item) => {
          acc.calorias += Number(item.calorias || 0);
          acc.proteina += Number(item.proteina || 0);
          acc.carbohidratos += Number(item.carbohidratos || 0);
          acc.grasas += Number(item.grasas || 0);
          acc.fibra += Number(item.fibra || 0);
          acc.sodio += Number(item.sodio || 0);
          acc.azucar += Number(item.azucar || 0);
          return acc;
        },
        { calorias: 0, proteina: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0, azucar: 0 }
      );

      return {
        ...meal,
        items,
        totals: {
          calorias: Number(totals.calorias.toFixed(2)),
          proteina: Number(totals.proteina.toFixed(2)),
          carbohidratos: Number(totals.carbohidratos.toFixed(2)),
          grasas: Number(totals.grasas.toFixed(2)),
          fibra: Number(totals.fibra.toFixed(2)),
          sodio: Number(totals.sodio.toFixed(2)),
          azucar: Number(totals.azucar.toFixed(2))
        }
      };
    });

    const grandTotals = meals.reduce(
      (acc, meal) => {
        acc.calorias += meal.totals.calorias;
        acc.proteina += meal.totals.proteina;
        acc.carbohidratos += meal.totals.carbohidratos;
        acc.grasas += meal.totals.grasas;
        acc.fibra += meal.totals.fibra;
        acc.sodio += meal.totals.sodio;
        acc.azucar += meal.totals.azucar;
        return acc;
      },
      { calorias: 0, proteina: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0, azucar: 0 }
    );

    return {
      diet,
      meals,
      totals: {
        calorias: Number(grandTotals.calorias.toFixed(2)),
        proteina: Number(grandTotals.proteina.toFixed(2)),
        carbohidratos: Number(grandTotals.carbohidratos.toFixed(2)),
        grasas: Number(grandTotals.grasas.toFixed(2))
      }
    };
  },

  routine: {
    create(data) {
      const res = statements.routines.create.run({
        patient_id: Number(data.patient_id),
        nombre: String(data.nombre || "").trim(),
        semanas: Number(data.semanas || 1),
        frecuencia: Number(data.frecuencia || 5),
        notas: toNullableText(data.notas)
      });
      return statements.routines.getById.get(res.lastInsertRowid);
    },
    createFull(data) {
      const transaction = db.transaction((data) => {
        console.log(`[DB] Creando rutina completa para paciente ${data.patient_id}: ${data.nombre}`);
        const routine = database.routine.create({
          patient_id: data.patient_id,
          nombre: data.nombre,
          semanas: data.semanas,
          frecuencia: data.frecuencia,
          notas: data.notas
        });

        if (data.exercises && Array.isArray(data.exercises)) {
          console.log(`[DB] Guardando ${data.exercises.length} ejercicios...`);
          data.exercises.forEach((ex) => {
            database.routineExercise.add({
              routine_id: routine.id,
              exercise_id: ex.exercise_id || ex.id,
              series: ex.series,
              repeticiones: ex.repeticiones,
              descanso: ex.descanso,
              peso_sugerido: ex.peso_sugerido,
              notas: ex.notas,
              orden: ex.orden,
              semana: ex.semana,
              dia: ex.dia,
              grupo_muscular_objetivo: ex.grupo_muscular_objetivo,
              sets_breakdown: ex.sets_breakdown
            });
          });
        }
        return routine;
      });
      return transaction(data);
    },
    updateFull(data) {
      const transaction = db.transaction((data) => {
        const routineId = Number(data.id);
        if (!routineId) throw new Error("ID de rutina no proporcionado para actualización");

        console.log(`[DB] Actualizando rutina completa ${routineId}: ${data.nombre}`);

        // Update baseline info
        database.routine.update({
          id: routineId,
          nombre: data.nombre,
          semanas: data.semanas,
          frecuencia: data.frecuencia,
          notas: data.notas
        });

        // Purge old exercises
        db.prepare('DELETE FROM routine_exercises WHERE routine_id = ?').run(routineId);

        // Add new ones
        if (data.exercises && Array.isArray(data.exercises)) {
          console.log(`[DB] Re-guardando ${data.exercises.length} ejercicios...`);
          data.exercises.forEach((ex) => {
            database.routineExercise.add({
              routine_id: routineId,
              exercise_id: ex.exercise_id || ex.id,
              series: ex.series,
              repeticiones: ex.repeticiones,
              descanso: ex.descanso,
              peso_sugerido: ex.peso_sugerido,
              notas: ex.notas,
              orden: ex.orden,
              semana: ex.semana,
              dia: ex.dia,
              grupo_muscular_objetivo: ex.grupo_muscular_objetivo,
              sets_breakdown: ex.sets_breakdown
            });
          });
        }
        return { ok: true, id: routineId };
      });
      return transaction(data);
    },
    getByPatient(patientId) {
      const routines = statements.routines.getByPatientId.all(Number(patientId)) || [];
      return routines.map(r => {
        const exercises = (statements.routineExercises.getByRoutineId.all(r.id) || []).map(ex => {
          if (ex.sets_breakdown) {
            try { ex.sets_breakdown = JSON.parse(ex.sets_breakdown); } 
            catch(e) { ex.sets_breakdown = []; }
          } else {
            ex.sets_breakdown = [];
          }
          return ex;
        });
        return { ...r, exercises };
      });
    },
    search(query) {
      const q = `%${query}%`;
      return statements.st_exercises.search.all(q, q, q);
    },
    update(data) {
      statements.routines.update.run({
        id: Number(data.id),
        nombre: String(data.nombre || "").trim(),
        semanas: Number(data.semanas || 1),
        frecuencia: Number(data.frecuencia || 5),
        notas: toNullableText(data.notas)
      });
      return statements.routines.getById.get(Number(data.id));
    },
    delete(id) {
      statements.routines.delete.run(Number(id));
      return { ok: true };
    }
  },

  routineExercise: {
    add(data) {
      const res = statements.routineExercises.add.run({
        routine_id: Number(data.routine_id),
        exercise_id: Number(data.exercise_id),
        series: Number(data.series || 0),
        repeticiones: toNullableText(data.repeticiones),
        descanso: toNullableText(data.descanso),
        peso_sugerido: toNullableText(data.peso_sugerido),
        notas: toNullableText(data.notas),
        orden: Number(data.orden || 1),
        semana: toNullableText(data.semana),
        dia: toNullableText(data.dia),
        grupo_muscular_objetivo: toNullableText(data.grupo_muscular_objetivo),
        sets_breakdown: data.sets_breakdown ? (typeof data.sets_breakdown === 'string' ? data.sets_breakdown : JSON.stringify(data.sets_breakdown)) : null
      });
      return res.lastInsertRowid;
    },
    update(data) {
      statements.routineExercises.update.run({
        id: Number(data.id),
        exercise_id: Number(data.exercise_id),
        series: Number(data.series || 0),
        repeticiones: toNullableText(data.repeticiones),
        descanso: toNullableText(data.descanso),
        peso_sugerido: toNullableText(data.peso_sugerido),
        notas: toNullableText(data.notas),
        orden: Number(data.orden || 1),
        semana: toNullableText(data.semana),
        dia: toNullableText(data.dia),
        grupo_muscular_objetivo: toNullableText(data.grupo_muscular_objetivo),
        sets_breakdown: data.sets_breakdown ? (typeof data.sets_breakdown === 'string' ? data.sets_breakdown : JSON.stringify(data.sets_breakdown)) : null
      });
      return true;
    },
    delete(id) {
      statements.routineExercises.delete.run(Number(id));
      return { ok: true };
    }
  },

  foods: {
    create(data) {
      const payload = normalizeFoodPayload(data);
      validateFoodPayload(payload);

      const result = statements.foods.create.run(payload);
      return statements.foods.getById.get(result.lastInsertRowid);
    },

    getAll() {
      return statements.foods.getAll.all();
    },

    getById(id) {
      return statements.foods.getById.get(Number(id)) || null;
    },

    update(data) {
      const payload = normalizeFoodPayload(data);

      if (!payload.id) {
        throw new Error("El id del alimento es obligatorio para actualizar.");
      }

      validateFoodPayload(payload);

      const result = statements.foods.update.run(payload);

      if (result.changes === 0) {
        throw new Error("No se encontró el alimento a actualizar.");
      }

      return statements.foods.getById.get(payload.id);
    },

    delete(id) {
      const foodId = Number(id);
      const res = statements.foods.delete.run(foodId);
      return { ok: res.changes > 0, deletedId: foodId };
    },

    search(query) {
      const q = `%${query}%`;
      return statements.foods.search.all(q, q);
    }
  },

  diet: {
    getByPatientId(patientId) {
       return (statements.diets.getAllByPatientId.all(Number(patientId)) || []);
    },
    createFull(data) {
      const transaction = db.transaction((data) => {
        // Create Diet
        const dietRes = statements.diets.create.run({
          patient_id: Number(data.patient_id),
          nombre: String(data.nombre || "").trim(),
          objetivo: toNullableText(data.objetivo),
          calorias_totales: toNumber(data.calorias_objetivo || data.calorias_totales, 0),
          proteina_total: toNumber(data.proteina_objetivo || data.proteina_total, 0),
          carbohidratos_total: toNumber(data.carbs_objetivo || data.carbohidratos_total, 0),
          grasas_total: toNumber(data.grasas_objetivo || data.grasas_total, 0),
          notas: toNullableText(data.notas),
          activa: 1
        });
        const dietId = dietRes.lastInsertRowid;

        if (data.meals && Array.isArray(data.meals)) {
          data.meals.forEach((meal, mealIdx) => {
            const mealRes = statements.dietMeals.create.run({
              diet_id: dietId,
              nombre: String(meal.nombre || `Comida ${mealIdx + 1}`).trim(),
              orden: mealIdx + 1,
              notas: null
            });
            const mealId = mealRes.lastInsertRowid;

            // Handle Options (Variants)
            const options = meal.options || [{ nombre: 'Opción 1', items: meal.items || [] }];
            
            options.forEach((option) => {
              const optionItems = option.items || [];
              optionItems.forEach((item) => {
                db.prepare(`
                  INSERT INTO diet_meal_items (
                    meal_id, food_id, cantidad, unidad_personalizada, 
                    calorias, proteina, carbohidratos, grasas, fibra, sodio, azucar,
                    notas, variante
                  ) VALUES (
                    @meal_id, @food_id, @cantidad, @unidad_personalizada,
                    @calorias, @proteina, @carbohidratos, @grasas, @fibra, @sodio, @azucar,
                    @notas, @variante
                  )
                `).run({
                  meal_id: mealId,
                  food_id: Number(item.food_id),
                  cantidad: Number(item.cantidad || 1),
                  unidad_personalizada: toNullableText(item.unidad || item.unidad_personalizada),
                  calorias: Number(item.calorias || 0),
                  proteina: Number(item.proteina || 0),
                  carbohidratos: Number(item.carbohidratos || 0),
                  grasas: Number(item.grasas || 0),
                  fibra: Number(item.fibra || 0),
                  sodio: Number(item.sodio || 0),
                  azucar: Number(item.azucar || 0),
                  notas: toNullableText(item.notas),
                  variante: String(option.nombre || 'Opción 1')
                });
              });
            });
          });
        }
        return { id: dietId };
      });
      return transaction(data);
    },
    updateFull(data) {
      const transaction = db.transaction((data) => {
        const dietId = Number(data.id);
        if (!dietId) throw new Error("ID de dieta no proporcionado para actualización");

        // Update the basic diet info
        db.prepare(`
          UPDATE diets 
          SET 
            nombre = @nombre, 
            objetivo = @objetivo, 
            calorias_totales = @calorias_totales, 
            proteina_total = @proteina_total, 
            carbohidratos_total = @carbohidratos_total, 
            grasas_total = @grasas_total, 
            notas = @notas, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = @id
        `).run({
          id: dietId,
          nombre: String(data.nombre || "").trim(),
          objetivo: toNullableText(data.objetivo),
          calorias_totales: toNumber(data.calorias_objetivo || data.calorias_totales, 0),
          proteina_total: toNumber(data.proteina_objetivo || data.proteina_total, 0),
          carbohidratos_total: toNumber(data.carbs_objetivo || data.carbohidratos_total, 0),
          grasas_total: toNumber(data.grasas_objetivo || data.grasas_total, 0),
          notas: toNullableText(data.notas)
        });

        // Delete all old meals (CASCADE will delete meal items)
        db.prepare('DELETE FROM diet_meals WHERE diet_id = ?').run(dietId);

        // Re-add new meals and items
        if (data.meals && Array.isArray(data.meals)) {
          data.meals.forEach((meal, mealIdx) => {
            const mealRes = statements.dietMeals.create.run({
              diet_id: dietId,
              nombre: String(meal.nombre || `Comida ${mealIdx + 1}`).trim(),
              orden: mealIdx + 1,
              notas: null
            });
            const mealId = mealRes.lastInsertRowid;

            // Handle Options (Variants)
            const options = meal.options || [{ nombre: 'Opción 1', items: meal.items || [] }];

            options.forEach((option) => {
              const optionItems = option.items || [];
              optionItems.forEach((item) => {
                db.prepare(`
                  INSERT INTO diet_meal_items (
                    meal_id, food_id, cantidad, unidad_personalizada, 
                    calorias, proteina, carbohidratos, grasas, fibra, sodio, azucar,
                    notas, variante
                  ) VALUES (
                    @meal_id, @food_id, @cantidad, @unidad_personalizada,
                    @calorias, @proteina, @carbohidratos, @grasas, @fibra, @sodio, @azucar,
                    @notas, @variante
                  )
                `).run({
                  meal_id: mealId,
                  food_id: Number(item.food_id),
                  cantidad: Number(item.cantidad || 1),
                  unidad_personalizada: toNullableText(item.unidad || item.unidad_personalizada),
                  calorias: Number(item.calorias || 0),
                  proteina: Number(item.proteina || 0),
                  carbohidratos: Number(item.carbohidratos || 0),
                  grasas: Number(item.grasas || 0),
                  fibra: Number(item.fibra || 0),
                  sodio: Number(item.sodio || 0),
                  azucar: Number(item.azucar || 0),
                  notas: toNullableText(item.notas),
                  variante: String(option.nombre || 'Opción 1')
                });
              });
            });
          });
        }
        return { ok: true, id: dietId };
      });
      return transaction(data);
    },
    delete(id) {
      const res = statements.diets.delete.run(Number(id));
      return { ok: res.changes > 0 };
    }
  },

  patientProfile(patientId) {
    const pid = Number(patientId);
    const patient = statements.patients.getById.get(pid);
    if (!patient) return null;

    const measurements = statements.measurements.getByPatientId.all(pid) || [];
    
    // ANEXAR FOTOS A CADA MEDICIÓN
    for (const m of measurements) {
      m.fotos = statements.measurementPhotos.getByMeasurementId.all(m.id) || [];
    }

    const latest = measurements.length > 0 ? [...measurements].sort((a, b) => {
      const dateA = new Date(a.fecha || a.created_at).getTime();
      const dateB = new Date(b.fecha || b.created_at).getTime();
      return dateB - dateA;
    })[0] : null;

    if (latest) {
      patient.antropometria = {
        peso_actual_kg: latest.peso_kg,
        bf_porcentaje: latest.grasa_corporal,
        masa_magra_kg: latest.masa_magra
      };
    }

    return {
      patient,
      measurements,
      diets: statements.diets.getAllByPatientId.all(pid) || [],
      routines: (statements.routines.getByPatientId.all(pid) || []).map(r => {
        const exercises = (statements.routineExercises.getByRoutineId.all(r.id) || []).map(ex => {
          if (ex.sets_breakdown) {
            try { ex.sets_breakdown = JSON.parse(ex.sets_breakdown); } 
            catch(e) { ex.sets_breakdown = []; }
          } else {
            ex.sets_breakdown = [];
          }
          return ex;
        });
        return { ...r, exercises };
      }),
      generated_documents: statements.generatedDocuments.getByPatientId.all(pid) || []
    };
  },

  documents: {
    create(data) {
      const res = statements.generatedDocuments.create.run({
        patient_id: Number(data.patient_id),
        nombre: String(data.nombre || "").trim(),
        tipo: toNullableText(data.tipo),
        file_path: String(data.file_path || "").trim(),
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      });
      return { ok: true, id: res.lastInsertRowid };
    },
    getByPatient(patientId) {
      return statements.generatedDocuments.getByPatientId.all(Number(patientId));
    },
    delete(id) {
      const res = statements.generatedDocuments.delete.run(Number(id));
      return { ok: res.changes > 0 };
    }
  },

  comparisons: {
    create(data) {
      const res = statements.patientComparisons.create.run({
        patient_id: Number(data.patient_id),
        title: String(data.title || "Comparativa").trim(),
        initial_id: data.initial_id ? Number(data.initial_id) : null,
        final_id: data.final_id ? Number(data.final_id) : null,
        sections: data.sections ? (typeof data.sections === 'string' ? data.sections : JSON.stringify(data.sections)) : null
      });
      return { ok: true, id: res.lastInsertRowid };
    },
    getByPatient(patientId) {
      const rows = statements.patientComparisons.getByPatientId.all(Number(patientId)) || [];
      return rows.map(r => {
        if (r.sections) {
          try { r.sections = JSON.parse(r.sections); } catch(e) { r.sections = null; }
        }
        return r;
      });
    },
    delete(id) {
      const res = statements.patientComparisons.delete.run(Number(id));
      return { ok: res.changes > 0 };
    }
  }
};

console.log("SQLite conectado en:", dbPath);

module.exports = database;