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
        }
    });

    function limparFormularioAniversario() {
        const form = document.getElementById('form-novo-aniversario');
        if (!form) return;
        form.reset();
        document.getElementById('aniv-id').value = '';
        document.getElementById('aniv-form-title').innerHTML =
            '<i class="bi bi-person-plus me-2 aniversarios-icon-title"></i>Cadastrar Novo Aniversário';
        document.getElementById('btn-salvar-aniversario').innerHTML =
            '<i class="bi bi-check-lg me-1"></i> Salvar';
        document.getElementById('btn-cancelar-edicao-aniversario').classList.add('d-none');
        document.getElementById('form-aniversario-card').style.display = 'none';
        document.getElementById('btn-toggle-form-aniversario').innerHTML =
            '<i class="bi bi-plus-lg me-1"></i> Novo';
    }

    document.addEventListener('click', event => {
        const editar = event.target.closest('.btn-editar-aniv');
        if (editar) {
            const aniversario = AppData.getAniversarios().find(item => item.id === editar.dataset.id);
            if (!aniversario) return;
            document.getElementById('aniv-id').value = aniversario.id;
            document.getElementById('aniv-nome').value = aniversario.nome;
            document.getElementById('aniv-data').value = aniversario.dataNascimento;
            document.getElementById('aniv-grupo').value = aniversario.grupo;
            document.getElementById('aniv-form-title').textContent = 'Editar Aniversário';
            document.getElementById('btn-salvar-aniversario').innerHTML =
                '<i class="bi bi-check-lg me-1"></i> Atualizar';
            document.getElementById('btn-cancelar-edicao-aniversario').classList.remove('d-none');
            document.getElementById('form-aniversario-card').style.display = 'block';
            document.getElementById('btn-toggle-form-aniversario').innerHTML =
                '<i class="bi bi-x-lg me-1"></i> Cancelar';
            document.getElementById('aniv-nome').focus();
            return;
        }

        if (event.target.closest('#btn-cancelar-edicao-aniversario')) {
            limparFormularioAniversario();
            return;
        }

        const toggle = event.target.closest('#btn-toggle-form-aniversario');
        if (toggle) {
            const formCard = document.getElementById('form-aniversario-card');
            const visivel = formCard.style.display !== 'none';
            if (visivel) {
                limparFormularioAniversario();
            } else {
                limparFormularioAniversario();
                formCard.style.display = 'block';
                toggle.innerHTML = '<i class="bi bi-x-lg me-1"></i> Cancelar';
            }
            return;
        }

        const remover = event.target.closest('.btn-remover-aniv');
        if (remover && confirm('Deseja remover este aniversário?')) {
            AppData.removerAniversario(remover.dataset.id);
            renderizarAniversarios();
        }
    });

    document.addEventListener('submit', event => {
        if (event.target.id !== 'form-novo-aniversario') return;
        event.preventDefault();

        const nome = document.getElementById('aniv-nome').value.trim();
        const dataNascimento = document.getElementById('aniv-data').value;
        const grupo = document.getElementById('aniv-grupo').value;
        if (!nome || !dataNascimento) return;

        const id = document.getElementById('aniv-id').value;
        if (id) {
            AppData.atualizarAniversario(id, { nome, dataNascimento, grupo });
        } else {
            AppData.adicionarAniversario({ nome, dataNascimento, grupo });
        }
        limparFormularioAniversario();
        renderizarAniversarios();
    });
});