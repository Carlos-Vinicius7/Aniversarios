/**
 * Sidebar.js
 * Controla toggle da sidebar e navegação SPA por fragmentos.
 * Os fragmentos são carregados via fetch() e injetados no #content-area.
 */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileToggle = document.getElementById('mobile-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const contentArea = document.getElementById('content-area');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-fragment]');

    // ==============================
    // TOGGLE SIDEBAR (Desktop)
    // ==============================
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Fechar todos os submenus ao colapsar
            if (sidebar.classList.contains('collapsed')) {
                const openCollapses = sidebar.querySelectorAll('.collapse.show');
                openCollapses.forEach(col => {
                    const bsCollapse = bootstrap.Collapse.getInstance(col);
                    if (bsCollapse) bsCollapse.hide();
                });
            }
        });
    }

    // ==============================
    // TOGGLE SIDEBAR (Mobile)
    // ==============================
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('show');
        });
    }

    // ==============================
    // NAVEGAÇÃO SPA - CARREGAR FRAGMENTOS
    // ==============================

    /**
     * Carrega um fragmento HTML e injeta no content-area.
     * @param {string} fragmentPath - Caminho relativo ao arquivo HTML do fragmento
     * @param {HTMLElement|null} activeLink - O link que foi clicado (para marcar como ativo)
     */
    async function loadFragment(fragmentPath, activeLink = null) {
        if (!contentArea) return;

        // Mostrar loading
        contentArea.innerHTML = `
            <div class="content-loading">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        `;

        try {
            const response = await fetch(fragmentPath);
            if (!response.ok) throw new Error(`Erro ao carregar: ${response.status}`);

            const html = await response.text();
            contentArea.innerHTML = html;

            // Re-trigger animação de entrada
            contentArea.style.animation = 'none';
            contentArea.offsetHeight; // Force reflow
            contentArea.style.animation = '';

        } catch (error) {
            console.error('Erro ao carregar fragmento:', error);
            contentArea.innerHTML = `
                <div class="fragment-card" style="text-align: center; padding: 60px 24px;">
                    <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 16px; display: block;"></i>
                    <h5>Erro ao carregar conteúdo</h5>
                    <p style="color: #6c757d;">Não foi possível carregar a página solicitada.</p>
                </div>
            `;
        }

        // Atualizar item ativo
        if (activeLink) {
            setActiveLink(activeLink);
        }

        // Fechar sidebar no mobile após navegar
        if (window.innerWidth < 992) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('show');
        }
    }

    /**
     * Marca o link ativo na sidebar.
     * @param {HTMLElement} activeLink
     */
    function setActiveLink(activeLink) {
        // Remover active de todos
        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        // Adicionar active ao clicado
        activeLink.classList.add('active');
    }

    // ==============================
    // EVENT LISTENERS NOS LINKS
    // ==============================
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const fragment = link.getAttribute('data-fragment');
            if (fragment) {
                loadFragment(fragment, link);
                // Atualizar hash na URL para bookmark
                const pageName = fragment.split('/').pop().replace('.html', '');
                history.pushState({ fragment: fragment }, '', `#${pageName}`);
            }
        });
    });

    // ==============================
    // NAVEGAÇÃO PELO HISTÓRICO (botão voltar/avançar)
    // ==============================
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.fragment) {
            const link = sidebar.querySelector(`[data-fragment="${e.state.fragment}"]`);
            loadFragment(e.state.fragment, link);
        }
    });

    // ==============================
    // CARREGAR FRAGMENTO PADRÃO (Dashboard)
    // ==============================
    function loadDefaultFragment() {
        const hash = window.location.hash.replace('#', '');
        let defaultLink = null;
        let defaultFragment = null;

        if (hash) {
            // Tentar encontrar o link correspondente ao hash
            navLinks.forEach(link => {
                const fragment = link.getAttribute('data-fragment');
                const pageName = fragment.split('/').pop().replace('.html', '');
                if (pageName.toLowerCase() === hash.toLowerCase()) {
                    defaultLink = link;
                    defaultFragment = fragment;
                }
            });
        }

        // Se não encontrou pelo hash, carregar Dashboard como padrão
        if (!defaultLink) {
            defaultLink = sidebar.querySelector('[data-fragment*="Dashboard"]');
            defaultFragment = defaultLink ? defaultLink.getAttribute('data-fragment') : null;
        }

        if (defaultFragment && defaultLink) {
            loadFragment(defaultFragment, defaultLink);
        }
    }

    loadDefaultFragment();
});
