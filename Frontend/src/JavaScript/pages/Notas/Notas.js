document.addEventListener('DOMContentLoaded', () => {
    function renderNotas() {
        const listContainer = document.getElementById('lista-notas');
        const noNotasMsg = document.getElementById('no-notas-msg');
        if (!listContainer || !noNotasMsg) return;

        listContainer.querySelectorAll('.nota-card-item').forEach(card => card.remove());
        const notas = AppData.getNotas();
        noNotasMsg.style.display = notas.length ? 'none' : 'block';

        notas.forEach(nota => {
            const card = document.createElement('div');
            const cabecalho = document.createElement('div');
            const titulo = document.createElement('h5');
            const acoes = document.createElement('div');
            const editar = document.createElement('button');
            const remover = document.createElement('button');
            const conteudo = document.createElement('p');
            const data = document.createElement('small');

            card.className = 'fragment-card nota-card-item p-3';
            cabecalho.className = 'd-flex justify-content-between align-items-start mb-2';
            titulo.className = 'mb-0 text-truncate';
            titulo.style.cssText = 'font-size: 1rem; font-weight: 600; max-width: 70%;';
            titulo.textContent = nota.titulo;
            acoes.className = 'd-flex gap-1';
            editar.className = 'btn btn-sm btn-outline-secondary py-0 px-1 btn-editar-nota';
            editar.dataset.id = nota.id;
            editar.title = 'Editar nota';
            editar.innerHTML = '<i class="bi bi-pencil"></i>';
            remover.className = 'btn btn-sm btn-outline-danger py-0 px-1 btn-remover-nota';
            remover.dataset.id = nota.id;
            remover.title = 'Excluir nota';
            remover.innerHTML = '<i class="bi bi-trash"></i>';
            acoes.append(editar, remover);
            cabecalho.append(titulo, acoes);

            conteudo.className = 'mb-2';
            conteudo.style.cssText = 'font-size: 0.85rem; color: var(--text-body); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;';
            conteudo.textContent = nota.conteudo;
            data.className = 'd-inline-flex align-items-center gap-1';
            data.style.cssText = 'font-size: 0.75rem; color: var(--accent-purple); font-weight: 500;';
            data.innerHTML = '<i class="bi bi-calendar-event"></i>';
            data.append(nota.data ? AppData.formatarDataExtenso(nota.data) : 'Sem data definida');
            card.append(cabecalho, conteudo, data);
            listContainer.appendChild(card);
        });
    }

    document.addEventListener('app:fragment-loaded', event => {
        if (event.detail.path.endsWith('Notas.html')) {
            renderNotas();
            limparEditorNota();
        }
    });

    function hojeISO() {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${hoje.getFullYear()}-${mes}-${dia}`;
    }

    function limparEditorNota() {
        const form = document.getElementById('form-nova-nota');
        if (!form) return;
        form.reset();
        document.getElementById('nota-id').value = '';
        document.getElementById('nota-data').value = hojeISO();
        document.getElementById('btn-salvar-nota').innerHTML =
            '<i class="bi bi-save me-2"></i>Salvar Nota';
        document.getElementById('btn-cancelar-edicao-nota').classList.add('d-none');
    }

    document.addEventListener('click', event => {
        const editar = event.target.closest('.btn-editar-nota');
        if (editar) {
            const nota = AppData.getNotas().find(item => item.id === editar.dataset.id);
            if (!nota) return;
            document.getElementById('nota-id').value = nota.id;
            document.getElementById('nota-titulo').value = nota.titulo;
            document.getElementById('nota-conteudo').value = nota.conteudo;
            document.getElementById('nota-data').value = nota.data || hojeISO();
            document.getElementById('btn-salvar-nota').innerHTML =
                '<i class="bi bi-save me-2"></i>Atualizar Nota';
            document.getElementById('btn-cancelar-edicao-nota').classList.remove('d-none');
            document.getElementById('nota-titulo').focus();
            return;
        }

        if (event.target.closest('#btn-cancelar-edicao-nota')) {
            limparEditorNota();
            return;
        }

        const remover = event.target.closest('.btn-remover-nota');
        if (remover && confirm('Deseja excluir esta nota?')) {
            AppData.removerNota(remover.dataset.id);
            if (document.getElementById('nota-id').value === remover.dataset.id) limparEditorNota();
            renderNotas();
        }
    });

    document.addEventListener('submit', event => {
        if (event.target.id !== 'form-nova-nota') return;
        event.preventDefault();

        const titulo = document.getElementById('nota-titulo').value.trim();
        const conteudo = document.getElementById('nota-conteudo').value.trim();
        const data = document.getElementById('nota-data').value;
        if (!titulo || !conteudo || !data) return;

        const id = document.getElementById('nota-id').value;
        if (id) {
            AppData.atualizarNota(id, { titulo, conteudo, data });
        } else {
            AppData.adicionarNota({ titulo, conteudo, data });
        }
        limparEditorNota();
        renderNotas();
    });
});
