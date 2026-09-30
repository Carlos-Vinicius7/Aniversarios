document.addEventListener('DOMContentLoaded', () => {
    function renderizarDashboard() {
        const total = document.getElementById('stat-total');
        const tbody = document.getElementById('dashboard-proximos-tbody');
        const listaAtividades = document.getElementById('dashboard-atividades');
        if (!total || !tbody || !listaAtividades) return;

        const estatisticas = AppData.getEstatisticas();
        total.textContent = estatisticas.total;
        document.getElementById('stat-semana').textContent = estatisticas.estaSemana;
        document.getElementById('stat-notas').textContent = estatisticas.notas;
        document.getElementById('stat-grupos').textContent = estatisticas.grupos;

        const proximos = AppData.getProximosAniversarios(5);
        const tabela = tbody.closest('table');
        const aniversariosVazio = document.getElementById('dashboard-proximos-vazio');
        tbody.replaceChildren();
        tabela.style.display = proximos.length ? '' : 'none';
        aniversariosVazio.style.display = proximos.length ? 'none' : 'block';

        proximos.forEach(aniversario => {
            const linha = document.createElement('tr');
            const nome = document.createElement('td');
            const data = document.createElement('td');
            const idade = document.createElement('td');
            const dias = document.createElement('td');
            const badge = document.createElement('span');
            const diasRestantes = aniversario.diasRestantes;
            nome.textContent = aniversario.nome;
            data.textContent = AppData.formatarDataExtenso(aniversario.dataNascimento);
            idade.textContent = `${aniversario.idade} anos`;
            badge.className = 'badge';
            badge.style.backgroundColor = diasRestantes <= 7
                ? 'var(--accent-magenta)'
                : diasRestantes <= 30 ? 'var(--accent-peach)' : 'var(--accent-purple)';
            badge.textContent = `${diasRestantes} dias`;
            dias.appendChild(badge);
            linha.append(nome, data, idade, dias);
            tbody.appendChild(linha);
        });

        const atividades = AppData.getAtividades().slice(0, 5);
        const atividadesVazio = document.getElementById('dashboard-atividades-vazio');
        listaAtividades.replaceChildren();
        atividadesVazio.style.display = atividades.length ? 'none' : 'block';
        atividades.forEach((atividade, indice) => {
            const item = document.createElement('li');
            const icone = document.createElement('i');
            const conteudo = document.createElement('div');
            const descricao = document.createElement('div');
            const quando = document.createElement('small');
            item.className = 'd-flex align-items-center py-2';
            if (indice < atividades.length - 1) item.classList.add('border-bottom', 'dashboard-activity-item');
            icone.className = 'bi bi-plus-circle me-3 dashboard-activity-icon-new';
            descricao.className = 'dashboard-activity-text';
            descricao.textContent = atividade.descricao.replace(/<\/?strong>/g, '');
            quando.className = 'text-muted';
            quando.textContent = AppData.tempoAtras(atividade.data);
            conteudo.append(descricao, quando);
            item.append(icone, conteudo);
            listaAtividades.appendChild(item);
        });
    }

    document.addEventListener('app:fragment-loaded', event => {
        if (event.detail.path.endsWith('Dashboard.html')) renderizarDashboard();
    });
});