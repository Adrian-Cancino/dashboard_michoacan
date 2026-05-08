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
    const { count, error: countError } = await supabase
      .from('noticias_michoacan')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error en count:', countError);
      throw countError;
    }

    if (count === null || count === undefined) {
      console.warn('⚠️ count es null/undefined');
    }

    const { data: simpleData, error: simpleError } = await supabase
      .from('noticias_michoacan')
      .select('id, medio, url, fecha_nota')
      .order('fecha_nota', { ascending: false });

    if (simpleError) {
      console.error('❌ Error en consulta simple:', simpleError);
      throw simpleError;
    }

    if (!simpleData || simpleData.length === 0) {
      console.warn('⚠️ Consulta simple devolvio 0 filas');
      debugInfo.set('RLS bloquea SELECT en noticias_michoacan — 0 filas aun con datos en BD');
      resumen.set({ totalNoticias: 0, porMedio: [], porSentimiento: [], porClasificacion: [], mencionesPersonas: [] });
      loading.set(false);
      return;
    }

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

    if (relationError) {
      console.error('❌ Error en consulta con relacion:', relationError);
      throw relationError;
    }

    if (!relationData || relationData.length === 0) {
      console.warn('⚠️ Consulta con join devolvio 0 filas (la simple si tenia datos)');
      debugInfo.set('consulta simple OK pero join falla — revisar RLS o FK en analisis_noticias_michoacan');
      resumen.set({ totalNoticias: 0, porMedio: [], porSentimiento: [], porClasificacion: [], mencionesPersonas: [] });
      loading.set(false);
      return;
    }

    let datosProcesados = relationData.map(nota => {
      const analisis = Array.isArray(nota.analisis_noticias_michoacan)
        ? nota.analisis_noticias_michoacan[0]
        : nota.analisis_noticias_michoacan;

      return {
        ...nota,
        analisis: analisis || {}
      };
    });

    if (persona) {
      const campoPersona = getCampoPersona(persona);
      if (campoPersona) {
        datosProcesados = datosProcesados.filter(nota =>
          esVerdadero(nota.analisis?.[campoPersona])
        );
      }
    }

    if (datosProcesados.length === 0) {
      console.warn('⚠️ [5/6] No hay datos despues de aplicar filtros');
      resumen.set({ totalNoticias: 0, porMedio: [], porSentimiento: [], porClasificacion: [], mencionesPersonas: [] });
      loading.set(false);
      return;
    }

    const procesados = procesarDatos(datosProcesados);

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
    const { data, error } = await supabase
      .from('noticias_michoacan')
      .select('medio')
      .not('medio', 'is', null);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('⚠️ obtenerMediosUnicos: 0 medios encontrados');
      return [];
    }

    const mediosUnicos = [...new Set(data.map(d => d.medio))].sort();
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

  const porMedioMap = {};
  datos.forEach(nota => {
    const medio = nota.medio || 'Sin Medio';
    porMedioMap[medio] = (porMedioMap[medio] || 0) + 1;
  });
  const porMedio = Object.entries(porMedioMap).map(([medio, cantidad]) => ({ medio, cantidad }));

  const porSentimientoMap = {};
  datos.forEach(nota => {
    const sentimiento = nota.analisis?.sentimiento || 'Sin Clasificar';
    porSentimientoMap[sentimiento] = (porSentimientoMap[sentimiento] || 0) + 1;
  });
  const porSentimiento = Object.entries(porSentimientoMap).map(([sentimiento, cantidad]) => ({ sentimiento, cantidad }));

  const porClasificacionMap = {};
  datos.forEach(nota => {
    const clasificacion = nota.analisis?.clasificacion || 'Sin Clasificar';
    porClasificacionMap[clasificacion] = (porClasificacionMap[clasificacion] || 0) + 1;
  });
  const porClasificacion = Object.entries(porClasificacionMap).map(([clasificacion, cantidad]) => ({ clasificacion, cantidad }));

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

  return {
    totalNoticias,
    porMedio,
    porSentimiento,
    porClasificacion,
    mencionesPersonas
  };
}
