document.addEventListener('DOMContentLoaded', () => {
    const linkToLogin = document.getElementById('link-to-login');
    const linkToCadastro = document.getElementById('link-to-cadastro');
    
    const cadastroContainer = document.getElementById('cadastro-container');
    const loginContainer = document.getElementById('login-container');

    if (linkToLogin && linkToCadastro && cadastroContainer && loginContainer) {
        linkToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            cadastroContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });

        linkToCadastro.addEventListener('click', function(e) {
            e.preventDefault();
            loginContainer.style.display = 'none';
            cadastroContainer.style.display = 'block';
        });
    }

    // Permite abrir direto um dos formulários a partir da landing page:
    // login.html#entrar  ou  login.html#cadastro
    function mostrarFormularioPelaHash() {
        if (!cadastroContainer || !loginContainer) return;
        const hash = window.location.hash;
        if (hash === '#entrar') {
            cadastroContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        } else if (hash === '#cadastro') {
            loginContainer.style.display = 'none';
            cadastroContainer.style.display = 'block';
        }
    }
    mostrarFormularioPelaHash();
    window.addEventListener('hashchange', mostrarFormularioPelaHash);

    const formLogin = document.querySelector('.formulario-login');
    const formCadastro = document.querySelector('.formulario-cadastro');

    if (formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = '../App/app.html';
        });
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = '../App/app.html';
        });
    }
});
