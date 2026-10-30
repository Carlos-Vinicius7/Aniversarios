document.addEventListener('DOMContentLoaded', () => {
    const camposPreferencia = {
        notifEmail: 'notificacao_email',
        notifPush: 'notificacao_push',
        lembrete3dias: 'lembrete_3_dias',
        lembreteNoDia: 'lembrete_no_dia'
    };

    function renderizarPerfil() {
        const usuario = AppData.getUsuario();
        const preferencias = AppData.getPreferencias();
        if (!usuario || !preferencias) return;

        document.getElementById('perfil-nome').value = usuario.nome;
        document.getElementById('perfil-email').value = usuario.email;
        document.getElementById('perfil-telefone').value = usuario.telefone || '';
        document.getElementById('perfil-nascimento').value = usuario.nascimento || '';
        document.getElementById('perfil-display-nome').textContent = usuario.nome;
        document.getElementById('perfil-display-email').textContent = usuario.email;

        Object.entries(camposPreferencia).forEach(([id, campo]) => {
            document.getElementById(id).checked = preferencias[campo];
        });
    }

    document.addEventListener('app:fragment-loaded', event => {
        if (event.detail.path.endsWith('Perfil.html')) renderizarPerfil();
    });

    document.addEventListener('submit', async event => {
        if (event.target.id !== 'form-perfil') return;
        event.preventDefault();

        const erro = document.getElementById('perfil-msg-erro');
        const salvo = document.getElementById('perfil-msg-salvo');
        const botao = document.getElementById('btn-salvar-perfil');
        erro.hidden = true;
        salvo.hidden = true;
        botao.disabled = true;
        try {
            const usuario = await AppData.atualizarPerfil({
                nome: document.getElementById('perfil-nome').value.trim(),
                email: document.getElementById('perfil-email').value.trim(),
                telefone: document.getElementById('perfil-telefone').value.trim(),
                nascimento: document.getElementById('perfil-nascimento').value
            });
            document.getElementById('perfil-display-nome').textContent = usuario.nome;
            document.getElementById('perfil-display-email').textContent = usuario.email;
            salvo.hidden = false;
        } catch (error) {
            erro.textContent = error.message;
            erro.hidden = false;
        } finally {
            botao.disabled = false;
        }
    });

    document.addEventListener('change', async event => {
        const campo = camposPreferencia[event.target.id];
        if (!campo) return;

        const preferencias = { ...AppData.getPreferencias() };
        preferencias[campo] = event.target.checked;
        const erro = document.getElementById('preferencias-msg-erro');
        erro.hidden = true;
        try {
            await AppData.atualizarPreferencias(preferencias);
        } catch (error) {
            event.target.checked = AppData.getPreferencias()[campo];
            erro.textContent = error.message;
            erro.hidden = false;
        }
    });
});
