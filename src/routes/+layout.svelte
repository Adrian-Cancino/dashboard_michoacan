<script>
  import { page } from '$app/stores';
  import '../app.css';
</script>

<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="nav-brand">
      <svg class="brand-icon" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="var(--color-accent)"/>
        <path d="M16 5l11 6v6c0 6-4.5 11.5-11 12-6.5-.5-11-6-11-12v-6l11-6z" fill="var(--color-primary)" stroke="var(--color-accent)" stroke-width="1.2" stroke-linejoin="round"/>
        <text x="16" y="22" text-anchor="middle" fill="var(--color-accent)" font-size="14" font-weight="bold" font-family="Georgia, serif">M</text>
      </svg>
      <span class="brand-text">Dashboard Electoral <span class="brand-highlight">Michoacán</span></span>
    </a>
    <div class="nav-links">
      <a href="/" class="nav-link" class:active={!$page.url.pathname || $page.url.pathname === '/'}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="nav-icon">
          <path d="M3 3h14v14H3z"/><path d="M3 7h14"/><path d="M7 3v14"/>
          <circle cx="10" cy="11" r="2"/>
        </svg>
        Analisis de Noticias
      </a>
      <a href="/mapa" class="nav-link" class:active={$page.url.pathname === '/mapa'}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="nav-icon">
          <path d="M1 17l6-3 6 3 6-3V3l-6 3-6-3-6 3v14z"/><path d="M7 3v14"/><path d="M13 6v14"/>
        </svg>
        Mapa Electoral
      </a>
    </div>
  </div>
</nav>

<main>
  <slot />
</main>

<style>
  .navbar {
    background: var(--color-primary);
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    position: sticky;
    top: 0;
    z-index: 1000;
  }

  .nav-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--color-surface);
  }

  .brand-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .brand-text {
    font-family: var(--font-heading);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .brand-highlight {
    color: var(--color-accent);
  }

  .nav-links {
    display: flex;
    gap: 4px;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
    position: relative;
  }

  .nav-link:hover {
    color: rgba(255,255,255,0.95);
    background: rgba(255,255,255,0.08);
  }

  .nav-link.active {
    color: var(--color-accent);
    background: rgba(201, 168, 76, 0.12);
  }

  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 16px;
    right: 16px;
    height: 2px;
    background: var(--color-accent);
    border-radius: 1px;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  main {
    min-height: calc(100vh - 64px);
  }

  @media (max-width: 640px) {
    .nav-container {
      padding: 0 16px;
    }
    .brand-text {
      font-size: 16px;
    }
    .nav-link {
      padding: 8px 12px;
    }
  }
</style>
