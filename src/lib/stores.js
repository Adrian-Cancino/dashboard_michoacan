import { writable } from 'svelte/store';
import { supabase } from './supabase';

export const loading = writable(false);
export const error = writable(null);
export const debugInfo = writable('');
export const noticias = writable([]);
export const resumen = writable({
  totalNoticias: 0,
  porMedio: [],
  porSentimiento: [],
  porClasificacion: [],
  mencionesPersonas: []
});

export const filtrosActivos = writable({
  fechaInicio: null,
  fechaFin: null,
  persona: null,
  medio: null
});

function esVerdadero(valor) {
  if (!valor) return false;
  const v = valor.toString().toLowerCase().trim();
  return v === 'true' || v === 'si' || v === '1' || v === 'yes';
}

export async function cargarDatos({
  fechaInicio = null,
  fechaFin = null,
  persona = null,
  medio = null
} = {}) {
  loading.set(true);
  error.set(null);
  debugInfo.set('');

  filtrosActivos.set({ fechaInicio, fechaFin, persona, medio });

  try {
    console.log('═══════════════════════════════════════════');
    console.log('🔄 [1/6] Iniciando carga...', { fechaInicio, fechaFin, persona, medio });
    console.log('📡 URL Supabase:', supabase.supabaseUrl);

    // ── PASO 1: Probar acceso basico a la tabla ──
    console.log('🔄 [2/6] Probando acceso a noticias_michoacan...');
    const { count, error: countError } = await supabase
      .from('noticias_michoacan')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Count result:', { count, error: countError });

    if (countError) {
      console.error('❌ Error en count:', countError);
      throw countError;
    }

    if (count === null || count === undefined) {
      console.warn('⚠️ count es null/undefined');
    }

    console.log(`✅ Tabla noticias_michoacan tiene ${count} registros`);

    // ── PASO 2: Consulta simple (SOLO la tabla padre) ──
    console.log('🔄 [3/6] Consulta simple (sin join)...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('noticias_michoacan')
      .select('id, medio, url, fecha_nota')
      .order('fecha_nota', { ascending: false });

    console.log('📊 Simple query result:', {
      tieneData: simpleData !== undefined,
      length: simpleData?.length,
      error: simpleError,
      firstRow: simpleData?.[0] || null
    });

    if (simpleError) {
      console.error('❌ Error en consulta simple:', simpleError);
      throw simpleError;
    }

    if (!simpleData || simpleData.length === 0) {
      console.warn('⚠️ Consulta simple devolvio 0 filas');
      console.log('🔥 POSIBLE CAUSA: RLS (Row Level Security) bloqueando SELECT en noticias_michoacan');
      console.log('🔥 Solucion: En Supabase → Authentication → Policies → agregar policy SELECT para anon role');
      debugInfo.set('RLS bloquea SELECT en noticias_michoacan — 0 filas aun con datos en BD');
      resumen.set({ totalNoticias: 0, porMedio: [], porSentimiento: [], porClasificacion: [], mencionesPersonas: [] });
      loading.set(false);
      return;
    }

    // ── PASO 3: Probar relacion / join ──
    console.log('🔄 [4/6] Probando relacion con analisis_noticias_michoacan...');
    const { data: relationData, error: relationError } = await supabase
      .from('noticias_michoacan')
      .select(`
        id,
        medio,
        url,
        fecha_nota,
        analisis_noticias_michoacan (
          clasificacion,
          sentimiento,
          mencion_orozco,
          mencion_pina,
          mencion_alcazar,
          mencion_reyes,
          mencion_manriquez,
          mencion_quiroz
        )
      `)
      .order('fecha_nota', { ascending: false });

    console.log('📊 Relation query result:', {
      tieneData: relationData !== undefined,
      length: relationData?.length,
      error: relationError
    });

    if (relationError) {
      console.error('❌ Error en consulta con relacion:', relationError);
      console.log('🔥 La FK no es reconocida por Supabase/PostgREST');
      console.log('🔥 Solucion: Ejecutar en SQL: select reload_schema_cache();');
      throw relationError;
    }

    if (!relationData || relationData.length === 0) {
      console.warn('⚠️ Consulta con join devolvio 0 filas (la simple si tenia datos)');
      console.log('🔥 POSIBLE CAUSA: RLS bloqueando analisis_noticias_michoacan o error en FK');
      debugInfo.set('consulta simple OK pero join falla — revisar RLS o FK en analisis_noticias_michoacan');
      resumen.set({ totalNoticias: 0, porMedio: [], porSentimiento: [], porClasificacion: [], mencionesPersonas: [] });
      loading.set(false);
      return;
    }

    console.log('✅ Consulta con join OK —', relationData.length, 'filas');
    console.log('📋 Primera fila (abreviada):', {
      id: relationData[0].id,
      medio: relationData[0].medio,
      fecha_nota: relationData[0].fecha_nota,
      tieneAnalisis: relationData[0].analisis_noticias_michoacan !== null,
      analisisKeys: relationData[0].analisis_noticias_michoacan
        ? Object.keys(relationData[0].analisis_noticias_michoacan)
        : null
    });

    // ── PASO 4: Procesar datos ──
    console.log('🔄 [5/6] Procesando datos...');

    let datosProcesados = relationData.map(nota => {
      const analisis = Array.isArray(nota.analisis_noticias_michoacan)
        ? nota.analisis_noticias_michoacan[0]
        : nota.analisis_noticias_michoacan;

      return {
        ...nota,
        analisis: analisis || {}
      };
    });

    console.log('✅ Datos procesados:', datosProcesados.length, 'filas');
    console.log('📋 Primer registro procesado:', {
      medio: datosProcesados[0].medio,
      sentimiento: datosProcesados[0].analisis?.sentimiento,
      clasificacion: datosProcesados[0].analisis?.clasificacion
    });

    if (persona) {
      const campoPersona = getCampoPersona(persona);
      if (campoPersona) {
        console.log('👤 Filtrado por persona (cliente):', persona, '->', campoPersona);
        datosProcesados = datosProcesados.filter(nota =>
          esVerdadero(nota.analisis?.[campoPersona])
        );
        console.log('👤 Despues del filtro:', datosProcesados.length, 'noticias');
      }
    }

    if (datosProcesados.length === 0) {
      console.warn('⚠️ [5/6] No hay datos despues de aplicar filtros');
      resumen.set({ totalNoticias: 0, porMedio: [], porSentimiento: [], porClasificacion: [], mencionesPersonas: [] });
      loading.set(false);
      return;
    }

    // ── PASO 5: Generar resumen ──
    console.log('🔄 [6/6] Generando resumen con', datosProcesados.length, 'noticias...');

    const procesados = procesarDatos(datosProcesados);

    console.log('📊 Resumen generado:', procesados);
    console.log('═══════════════════════════════════════════');

    noticias.set(datosProcesados);
    resumen.set(procesados);

  } catch (err) {
    console.error('💥 Error critico:', err);
    console.error('📄 Mensaje:', err.message);
    console.error('🔍 Detalles:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    error.set(err.message || 'Error al cargar los datos');
  } finally {
    loading.set(false);
  }
}

function getCampoPersona(nombre) {
  const mapeo = {
    'Orozco': 'mencion_orozco',
    'Piña': 'mencion_pina',
    'Alcázar': 'mencion_alcazar',
    'Reyes': 'mencion_reyes',
    'Manríquez': 'mencion_manriquez',
    'Quiroz': 'mencion_quiroz'
  };
  return mapeo[nombre] || null;
}

export async function obtenerMediosUnicos() {
  try {
    console.log('🔍 obtenerMediosUnicos: consultando noticias_michoacan...');

    const { data, error } = await supabase
      .from('noticias_michoacan')
      .select('medio')
      .not('medio', 'is', null);

    console.log('🔍 obtenerMediosUnicos respuesta:', { length: data?.length, error });

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('⚠️ obtenerMediosUnicos: 0 medios encontrados');
      return [];
    }

    console.log('📰 Medios encontrados:', data.length);
    console.log('📰 Primeros 3 medios:', data.slice(0, 3).map(d => d.medio));

    const mediosUnicos = [...new Set(data.map(d => d.medio))].sort();
    console.log('📰 Medios unicos:', mediosUnicos);
    return mediosUnicos;
  } catch (err) {
    console.error('❌ Error al obtener medios:', err);
    return [];
  }
}

export const personasDisponibles = [
  'Orozco',
  'Piña',
  'Alcázar',
  'Reyes',
  'Manríquez',
  'Quiroz'
];

function procesarDatos(datos) {
  const totalNoticias = datos.length;
  console.log('📊 procesarDatos: total:', totalNoticias);

  const porMedioMap = {};
  datos.forEach(nota => {
    const medio = nota.medio || 'Sin Medio';
    porMedioMap[medio] = (porMedioMap[medio] || 0) + 1;
  });
  const porMedio = Object.entries(porMedioMap).map(([medio, cantidad]) => ({ medio, cantidad }));
  console.log('📊 porMedio:', porMedio);

  const porSentimientoMap = {};
  datos.forEach(nota => {
    const sentimiento = nota.analisis?.sentimiento || 'Sin Clasificar';
    porSentimientoMap[sentimiento] = (porSentimientoMap[sentimiento] || 0) + 1;
  });
  const porSentimiento = Object.entries(porSentimientoMap).map(([sentimiento, cantidad]) => ({ sentimiento, cantidad }));
  console.log('📊 porSentimiento:', porSentimiento);

  const porClasificacionMap = {};
  datos.forEach(nota => {
    const clasificacion = nota.analisis?.clasificacion || 'Sin Clasificar';
    porClasificacionMap[clasificacion] = (porClasificacionMap[clasificacion] || 0) + 1;
  });
  const porClasificacion = Object.entries(porClasificacionMap).map(([clasificacion, cantidad]) => ({ clasificacion, cantidad }));
  console.log('📊 porClasificacion:', porClasificacion);

  const personas = [
    { campo: 'mencion_orozco', nombre: 'Orozco' },
    { campo: 'mencion_pina', nombre: 'Piña' },
    { campo: 'mencion_alcazar', nombre: 'Alcázar' },
    { campo: 'mencion_reyes', nombre: 'Reyes' },
    { campo: 'mencion_manriquez', nombre: 'Manríquez' },
    { campo: 'mencion_quiroz', nombre: 'Quiroz' }
  ];

  const mencionesPersonas = personas.map(p => ({
    nombre: p.nombre,
    menciones: datos.filter(nota => esVerdadero(nota.analisis?.[p.campo])).length
  }));
  console.log('📊 mencionesPersonas:', mencionesPersonas);

  return {
    totalNoticias,
    porMedio,
    porSentimiento,
    porClasificacion,
    mencionesPersonas
  };
}
