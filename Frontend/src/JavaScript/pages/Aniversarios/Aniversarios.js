document.addEventListener('DOMContentLoaded', () => {
    function renderizarAniversarios() {
        const tbody = document.getElementById('aniversarios-tbody');
        const vazio = document.getElementById('aniversarios-vazio');
        const tabela = document.getElementById('tabela-aniversarios');
        if (!tbody || !vazio || !tabela) return;

        const aniversarios = AppData.getAniversarios();
        tbody.replaceChildren();
        tabela.style.display = aniversarios.length ? '' : 'none';
        vazio.style.display = aniversarios.length ? 'none' : 'block';

        aniversarios.forEach(aniversario => {
            const linha = document.createElement('tr');
            const nome = document.createElement('td');
            const data = document.createElement('td');
            const idade = document.createElement('td');
            const grupo = document.createElement('td');
            const acoes = document.createElement('td');
            const badge = document.createElement('span');
            const editar = document.createElement('button');
            const remover = document.createElement('button');

            nome.textContent = aniversario.nome;
            data.textContent = AppData.formatarDataBR(aniversario.dataNascimento);
            idade.textContent = `${AppData.calcularIdade(aniversario.dataNascimento)} anos`;
            badge.className = 'badge bg-light text-dark border';
            badge.textContent = aniversario.grupo;
            grupo.appendChild(badge);
            acoes.className = 'text-end';
            editar.className = 'btn btn-sm btn-outline-secondary me-1 btn-editar-aniv';
            editar.dataset.id = aniversario.id;
            editar.title = 'Editar aniversário';
            editar.innerHTML = '<i class="bi bi-pencil"></i>';
            remover.className = 'btn btn-sm btn-outline-danger btn-remover-aniv';
            remover.dataset.id = aniversario.id;
            remover.title = 'Remover aniversário';
            remover.innerHTML = '<i class="bi bi-trash"></i>';
            acoes.append(editar, remover);
            linha.append(nome, data, idade, grupo, acoes);
            tbody.appendChild(linha);
        });
    }

    document.addEventListener('app:fragment-loaded', event => {
        if (event.detail.path.endsWith('Aniversarios.html')) {
            renderizarAniversarios();
            limparFormularioAniversario();
        }
    });

    function iniciaisDe(nome) {
        const partes = nome.trim().split(/\s+/).filter(Boolean);
        if (!partes.length) return '?';
        const primeira = partes[0][0];
        const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
        return (primeira + ultima).toUpperCase();
    }

    function atualizarAvatarPreview() {
        const avatar = document.getElementById('aniv-modal-avatar');
        const nome = document.getElementById('aniv-nome').value;
        if (avatar) avatar.textContent = iniciaisDe(nome);
    }

    function marcarGrupoSelecionado(grupo) {
        const radios = document.querySelectorAll('.aniv-grupo-input');
        radios.forEach(radio => { radio.checked = radio.value === grupo; });
        if (![...radios].some(radio => radio.checked)) radios[0].checked = true;
    }

    function grupoSelecionado() {
        const marcado = document.querySelector('.aniv-grupo-input:checked');
        return marcado ? marcado.value : 'Geral';
    }

    function abrirModalAniversario() {
        const modalEl = document.getElementById('modal-aniversario');
        if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    function fecharModalAniversario() {
        const modalEl = document.getElementById('modal-aniversario');
        if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    }

    function limparFormularioAniversario() {
        const form = document.getElementById('form-novo-aniversario');
        if (!form) return;
        form.reset();
        document.getElementById('aniv-id').value = '';
        document.getElementById('aniv-form-title').textContent = 'Novo Aniversário';
        document.getElementById('btn-salvar-aniversario').innerHTML =
            '<i class="bi bi-check-lg me-1"></i> Salvar';
        marcarGrupoSelecionado('Família');
        atualizarAvatarPreview();
    }

    document.addEventListener('click', event => {
        const editar = event.target.closest('.btn-editar-aniv');
        if (editar) {
            const aniversario = AppData.getAniversarios().find(item => item.id === editar.dataset.id);
            if (!aniversario) return;
            document.getElementById('aniv-id').value = aniversario.id;
            document.getElementById('aniv-nome').value = aniversario.nome;
            document.getElementById('aniv-data').value = aniversario.dataNascimento;
            marcarGrupoSelecionado(aniversario.grupo);
            atualizarAvatarPreview();
            document.getElementById('aniv-form-title').textContent = 'Editar Aniversário';
            document.getElementById('btn-salvar-aniversario').innerHTML =
                '<i class="bi bi-check-lg me-1"></i> Atualizar';
            abrirModalAniversario();
            return;
        }

        if (event.target.closest('#btn-toggle-form-aniversario')) {
            limparFormularioAniversario();
            return;
        }

        const remover = event.target.closest('.btn-remover-aniv');
        if (remover && confirm('Deseja remover este aniversário?')) {
            AppData.removerAniversario(remover.dataset.id);
            renderizarAniversarios();
        }
    });

    document.addEventListener('input', event => {
        if (event.target.id === 'aniv-nome') atualizarAvatarPreview();
    });

    // Delegado em document porque o fragmento (e o modal) é injetado dinamicamente;
    // o evento 'hidden.bs.modal' do Bootstrap borbulha normalmente pelo DOM.
    document.addEventListener('hidden.bs.modal', event => {
        if (event.target.id === 'modal-aniversario') limparFormularioAniversario();
    });

    document.addEventListener('submit', event => {
        if (event.target.id !== 'form-novo-aniversario') return;
        event.preventDefault();

        const nome = document.getElementById('aniv-nome').value.trim();
        const dataNascimento = document.getElementById('aniv-data').value;
        const grupo = grupoSelecionado();
        if (!nome || !dataNascimento) return;

        const id = document.getElementById('aniv-id').value;
        if (id) {
            AppData.atualizarAniversario(id, { nome, dataNascimento, grupo });
        } else {
            AppData.adicionarAniversario({ nome, dataNascimento, grupo });
        }
        fecharModalAniversario();
        renderizarAniversarios();
    });
});