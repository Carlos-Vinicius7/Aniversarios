const appUrl = new URL('../../../Pages/App/app.html', document.currentScript.src).href;

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

    const formLogin = document.querySelector('.formulario-login');
    const formCadastro = document.querySelector('.formulario-cadastro');

    if (formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = appUrl;
        });
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = appUrl;
        });
    }
});
