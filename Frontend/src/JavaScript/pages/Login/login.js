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
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const erro = document.getElementById('login-error');
            const botao = formLogin.querySelector('button[type="submit"]');
            erro.hidden = true;
            botao.disabled = true;
            try {
                const dados = new FormData(formLogin);
                await AppData.entrar(dados.get('email'), dados.get('senha'));
                window.location.replace('../App/app.html');
            } catch (error) {
                erro.textContent = error.message;
                erro.hidden = false;
            } finally {
                botao.disabled = false;
            }
        });
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', async function(e) {
            e.preventDefault();
            const erro = document.getElementById('cadastro-error');
            const botao = formCadastro.querySelector('button[type="submit"]');
            erro.hidden = true;
            botao.disabled = true;
            try {
                const dados = new FormData(formCadastro);
                await AppData.registrar(
                    dados.get('nome'),
                    dados.get('email'),
                    dados.get('senha')
                );
                window.location.replace('../App/app.html');
            } catch (error) {
                erro.textContent = error.message;
                erro.hidden = false;
            } finally {
                botao.disabled = false;
            }
        });
    }
});
