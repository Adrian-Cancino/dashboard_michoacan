<script>
  import { onMount } from 'svelte';
  import { Bar, Doughnut } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';
  
  import { 
    loading, 
    error, 
    resumen, 
    cargarDatos, 
    obtenerMediosUnicos,
    personasDisponibles,
    filtrosActivos,
    debugInfo
  } from '$lib/stores';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
  );

  let fechaInicio = '';
  let fechaFin = '';
  let personaSeleccionada = '';
  let medioSeleccionado = '';
  let mediosDisponibles = [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 5,
        right: 5
      }
    },
    plugins: {
      legend: { 
        position: 'top',
        labels: { 
          font: { size: 11 },
          padding: 8
        }
      },
      title: { 
        display: false
      }
    }
  };

  const colors = {
    primary: '#6B1D2A',
    accent: '#C9A84C',
    slate: '#6B7280',
    teal: '#0D9488',
    rose: '#BE185D',
    amber: '#D97706',
    emerald: '#059669',
    gray: '#9CA3AF'
  };

  onMount(async () => {
    mediosDisponibles = await obtenerMediosUnicos();
    cargarDatos();
  });

  function recargar() {
    cargarDatos({
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      persona: personaSeleccionada || null,
      medio: medioSeleccionado || null
    });
  }

  function filtrarHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInicio = hoy;
    fechaFin = hoy;
    aplicarFiltro();
  }

  function filtrarUltimos7Dias() {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 7);
    fechaInicio = inicio.toISOString().split('T')[0];
    fechaFin = fin.toISOString().split('T')[0];
    aplicarFiltro();
  }

  function filtrarUltimos30Dias() {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    fechaInicio = inicio.toISOString().split('T')[0];
    fechaFin = fin.toISOString().split('T')[0];
    aplicarFiltro();
  }

  function filtrarTodo() {
    fechaInicio = '';
    fechaFin = '';
    personaSeleccionada = '';
    medioSeleccionado = '';
    cargarDatos();
  }

  function aplicarFiltro() {
    cargarDatos({
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      persona: personaSeleccionada || null,
      medio: medioSeleccionado || null
    });
  }

  function limpiarFiltros() {
    fechaInicio = '';
    fechaFin = '';
    personaSeleccionada = '';
    medioSeleccionado = '';
    cargarDatos();
  }

  function limpiarPersona() {
    personaSeleccionada = '';
    aplicarFiltro();
  }

  function limpiarMedio() {
    medioSeleccionado = '';
    aplicarFiltro();
  }

  $: hayFiltrosActivos = fechaInicio || fechaFin || personaSeleccionada || medioSeleccionado;
</script>

<div class="dashboard">
  <header class="page-header">
    <div class="header-content">
      <h1>Dashboard de Analisis de Noticias - Michoacan</h1>
      <p class="header-subtitle">Monitoreo de cobertura mediatica y analisis de sentimiento</p>
    </div>
    <button on:click={recargar} disabled={$loading} class="btn-reload">
      {#if $loading}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spinner-icon">
          <path d="M10 2v4M10 14v4M4.93 4.93l2.83 2.83M12.24 12.24l2.83 2.83M2 10h4M14 10h4M4.93 15.07l2.83-2.83M12.24 7.76l2.83-2.83"/>
        </svg>
        Cargando...
      {:else}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
          <path d="M14.5 4.5A7 7 0 014 12.5M5.5 15.5A7 7 0 0016 7.5"/>
          <path d="M14.5 1v3.5H11M5.5 19v-3.5H9"/>
        </svg>
        Actualizar
      {/if}
    </button>
  </header>

  {#if $error}
    <div class="error">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="error-icon">
        <circle cx="10" cy="10" r="9"/><path d="M10 6v4"/><path d="M10 14h0"/>
      </svg>
      <span>{$error}</span>
    </div>
  {/if}

  {#if $debugInfo}
    <div class="debug">
      <span>Debug: {$debugInfo}</span>
    </div>
  {/if}

  {#if $loading}
    <div class="loading">
      <div class="spinner-large"></div>
      <p>Cargando datos...</p>
    </div>
  {:else}
    <section class="card filters-card">
      <div class="filters-header">
        <h2 class="section-title">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="section-icon">
            <path d="M2 4h16M6 10h8M9 16h2"/>
            <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
          </svg>
          Filtros de Busqueda
        </h2>
        <div class="filters-actions">
          <button on:click={aplicarFiltro} class="btn btn-primary">
            Aplicar Filtros
          </button>
          <button on:click={limpiarFiltros} class="btn btn-secondary" disabled={!hayFiltrosActivos}>
            Limpiar
          </button>
        </div>
      </div>
      
      <div class="filters-grid">
        <div class="filter-group">
          <label for="fecha-inicio">Fecha Inicio</label>
          <input id="fecha-inicio" type="date" bind:value={fechaInicio} class="input" />
        </div>
        <div class="filter-group">
          <label for="fecha-fin">Fecha Fin</label>
          <input id="fecha-fin" type="date" bind:value={fechaFin} class="input" />
        </div>
        <div class="filter-group">
          <label for="persona-select">Persona</label>
          <div class="select-wrapper">
            <select id="persona-select" bind:value={personaSeleccionada} class="input">
              <option value="">Todas las personas</option>
              {#each personasDisponibles as persona}
                <option value={persona}>{persona}</option>
              {/each}
            </select>
            {#if personaSeleccionada}
              <button on:click={limpiarPersona} class="btn-clear-small" title="Limpiar filtro" type="button">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M3 3l8 8M11 3l-8 8"/>
                </svg>
              </button>
            {/if}
          </div>
        </div>
        <div class="filter-group">
          <label for="medio-select">Medio</label>
          <div class="select-wrapper">
            <select id="medio-select" bind:value={medioSeleccionado} class="input">
              <option value="">Todos los medios</option>
              {#each mediosDisponibles as medio}
                <option value={medio}>{medio}</option>
              {/each}
            </select>
            {#if medioSeleccionado}
              <button on:click={limpiarMedio} class="btn-clear-small" title="Limpiar filtro" type="button">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M3 3l8 8M11 3l-8 8"/>
                </svg>
              </button>
            {/if}
          </div>
        </div>
      </div>

      <div class="quick-filters">
        <span class="quick-filters-label">Filtros rapidos:</span>
        <button on:click={filtrarHoy} class="btn-quick">Hoy</button>
        <button on:click={filtrarUltimos7Dias} class="btn-quick">Ultimos 7 dias</button>
        <button on:click={filtrarUltimos30Dias} class="btn-quick">Ultimos 30 dias</button>
        <button on:click={filtrarTodo} class="btn-quick">Todo el historial</button>
      </div>
    </section>

    <section class="summary-cards">
      <div class="summary-card">
        <div class="summary-card-icon summary-card-icon--news">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9h4"/>
            <path d="M10 6h4M10 10h4M10 14h4"/>
          </svg>
        </div>
        <div class="summary-card-content">
          <span class="summary-card-label">Total Noticias</span>
          <span class="summary-card-value">{$resumen.totalNoticias}</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card-icon summary-card-icon--media">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </div>
        <div class="summary-card-content">
          <span class="summary-card-label">Medios Diferentes</span>
          <span class="summary-card-value">{$resumen.porMedio.length}</span>
        </div>
      </div>
    </section>

    <section class="charts-grid">
      {#if $resumen.porMedio.length > 0}
        <div class="chart-card full-width">
          <h3 class="chart-title">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="chart-icon">
              <rect x="2" y="8" width="3" height="10"/>
              <rect x="8.5" y="5" width="3" height="13"/>
              <rect x="15" y="2" width="3" height="16"/>
            </svg>
            Noticias por Medio
          </h3>
          <div class="chart-wrapper">
            <Bar
              data={{
                labels: $resumen.porMedio.map(m => m.medio),
                datasets: [{
                  label: 'Noticias',
                  data: $resumen.porMedio.map(m => m.cantidad),
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      {:else}
        <div class="chart-card full-width">
          <p class="chart-empty">No hay datos de medios disponibles</p>
        </div>
      {/if}

      {#if $resumen.porSentimiento.length > 0}
        <div class="chart-card">
          <h3 class="chart-title">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="chart-icon">
              <circle cx="10" cy="10" r="9"/>
              <path d="M7 8h0M13 8h0"/>
              <path d="M6 13c1.5 2 4 3 6.5 2.5S17 14 18 12"/>
            </svg>
            Analisis de Sentimiento
          </h3>
          <div class="chart-wrapper">
            <Doughnut
              data={{
                labels: $resumen.porSentimiento.map(s => s.sentimiento),
                datasets: [{
                  data: $resumen.porSentimiento.map(s => s.cantidad),
                  backgroundColor: [colors.emerald, colors.rose, colors.amber, colors.slate, colors.accent],
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      {:else}
        <div class="chart-card">
          <p class="chart-empty">No hay datos de sentimiento disponibles</p>
        </div>
      {/if}

      {#if $resumen.porClasificacion.length > 0}
        <div class="chart-card">
          <h3 class="chart-title">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="chart-icon">
              <path d="M4 4h12v12H4z"/><path d="M8 8h4M8 12h4"/>
            </svg>
            Clasificacion de Noticias
          </h3>
          <div class="chart-wrapper">
            <Bar
              data={{
                labels: $resumen.porClasificacion.map(c => c.clasificacion),
                datasets: [{
                  label: 'Cantidad',
                  data: $resumen.porClasificacion.map(c => c.cantidad),
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      {:else}
        <div class="chart-card">
          <p class="chart-empty">No hay datos de clasificacion disponibles</p>
        </div>
      {/if}

      {#if $resumen.mencionesPersonas.length > 0}
        <div class="chart-card">
          <h3 class="chart-title">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="chart-icon">
              <path d="M14 5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path d="M2 17c0-3.3 3.6-6 8-6s8 2.7 8 6"/>
            </svg>
            Menciones por Persona
          </h3>
          <div class="chart-wrapper">
            <Bar
              data={{
                labels: $resumen.mencionesPersonas.map(p => p.nombre),
                datasets: [{
                  label: 'Menciones',
                  data: $resumen.mencionesPersonas.map(p => p.menciones),
                  backgroundColor: colors.teal,
                  borderColor: colors.teal,
                  borderWidth: 1
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      {:else}
        <div class="chart-card">
          <p class="chart-empty">No hay datos de menciones disponibles</p>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .dashboard {
    max-width: 1600px;
    margin: 0 auto;
    padding: 30px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 24px 30px;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border-left: 4px solid var(--color-accent);
  }

  .header-content h1 {
    margin: 0;
    font-size: 24px;
    color: var(--color-primary);
    letter-spacing: -0.3px;
  }

  .header-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    font-family: var(--font-body);
  }

  .btn-reload {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body);
    transition: background 0.2s;
    white-space: nowrap;
  }

  .btn-reload:hover:not(:disabled) {
    background: var(--color-primary-light);
  }

  .btn-reload:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-icon, .spinner-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spinner-icon {
    animation: spin 1.5s linear infinite;
  }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
  }

  .filters-card {
    padding: 24px 28px;
    margin-bottom: 24px;
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 16px;
    color: var(--color-primary);
    font-weight: 700;
  }

  .section-icon {
    width: 18px;
    height: 18px;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .filters-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    padding: 8px 18px;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-body);
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--color-accent);
    color: var(--color-primary-dark);
  }

  .btn-primary:hover {
    background: var(--color-accent-light);
  }

  .btn-secondary {
    background: var(--color-border);
    color: var(--color-text-secondary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: #d1d5db;
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .filter-group label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .input {
    padding: 10px 12px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: var(--font-body);
    background: var(--color-surface);
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: var(--color-text);
  }

  .input:hover {
    border-color: var(--color-primary-light);
  }

  .input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .select-wrapper select {
    padding-right: 35px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .btn-clear-small {
    position: absolute;
    right: 8px;
    background: var(--color-border);
    color: var(--color-text-secondary);
    border: none;
    width: 22px;
    height: 22px;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .btn-clear-small:hover {
    background: var(--color-error);
    color: white;
  }

  .btn-clear-small svg {
    width: 12px;
    height: 12px;
  }

  .quick-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding-top: 4px;
  }

  .quick-filters-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    margin-right: 4px;
  }

  .btn-quick {
    padding: 6px 14px;
    background: var(--color-bg);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-body);
    transition: all 0.2s;
  }

  .btn-quick:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-md);
    transition: transform 0.2s, box-shadow 0.2s;
    border-top: 3px solid var(--color-accent);
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .summary-card-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .summary-card-icon svg {
    width: 26px;
    height: 26px;
  }

  .summary-card-icon--news {
    background: rgba(107, 29, 42, 0.1);
    color: var(--color-primary);
  }

  .summary-card-icon--media {
    background: rgba(201, 168, 76, 0.15);
    color: var(--color-accent-dark);
  }

  .summary-card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-card-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-card-value {
    font-family: var(--font-heading);
    font-size: 36px;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1.1;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 30px;
  }

  .chart-card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-md);
    height: 380px;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chart-card.full-width {
    grid-column: 1 / -1;
  }

  .chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 15px;
    color: var(--color-primary);
    font-weight: 700;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .chart-icon {
    width: 18px;
    height: 18px;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .chart-wrapper {
    flex: 1;
    position: relative;
    min-height: 0;
    overflow: hidden;
  }

  .chart-empty {
    text-align: center;
    color: var(--color-text-muted);
    margin: auto;
    font-size: 14px;
  }

  .error {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    color: var(--color-error);
    padding: 14px 18px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    font-size: 14px;
  }

  .error-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    color: var(--color-text-secondary);
    font-size: 15px;
  }

  .spinner-large {
    width: 36px;
    height: 36px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .debug {
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 13px;
    font-family: monospace;
  }

  @media (max-width: 1200px) {
    .filters-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 1024px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    .summary-cards {
      grid-template-columns: 1fr;
    }
    .chart-card,
    .chart-card.full-width {
      grid-column: 1 / -1;
    }
    .chart-card {
      height: 340px;
    }
    .filters-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .filters-actions {
      width: 100%;
    }
    .filters-actions button {
      flex: 1;
    }
  }

  @media (max-width: 640px) {
    .dashboard {
      padding: 16px;
    }
    .page-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
      padding: 20px;
    }
    .header-subtitle {
      font-size: 13px;
    }
    .btn-reload {
      width: 100%;
      justify-content: center;
    }
    .summary-cards {
      grid-template-columns: 1fr;
    }
    .summary-card {
      flex-direction: column;
      text-align: center;
    }
    .chart-card,
    .chart-card.full-width {
      height: 300px;
    }
    .quick-filters {
      flex-direction: column;
      align-items: stretch;
    }
    .filters-grid {
      grid-template-columns: 1fr;
    }
    .filters-actions {
      flex-direction: column;
    }
  }
</style>
