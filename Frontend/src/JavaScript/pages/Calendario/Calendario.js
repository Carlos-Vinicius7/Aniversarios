document.addEventListener('DOMContentLoaded', () => {
    const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    let mesAtual = new Date().getMonth();
    let anoAtual = new Date().getFullYear();

    function renderizarCalendario() {
        const grid = document.getElementById('cal-grid');
        const titulo = document.getElementById('cal-titulo');
        if (!grid || !titulo) return;

        const cabecalhos = Array.from(grid.querySelectorAll('.calendar-day-header'));
        grid.replaceChildren(...cabecalhos);
        titulo.textContent = `${AppData.MESES[mesAtual]} ${anoAtual}`;

        const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
        const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
        const hoje = new Date();
        const aniversariosPorDia = {};
        AppData.getAniversariosDoMes(mesAtual, anoAtual).forEach(aniversario => {
            if (!aniversariosPorDia[aniversario.dia]) aniversariosPorDia[aniversario.dia] = [];
            aniversariosPorDia[aniversario.dia].push(aniversario);
        });

        const notasPorDia = {};
        AppData.getNotas().forEach(nota => {
            if (!nota.data) return;
            const [ano, mes, dia] = nota.data.split('-').map(Number);
            if (ano === anoAtual && mes - 1 === mesAtual) {
                if (!notasPorDia[dia]) notasPorDia[dia] = [];
                notasPorDia[dia].push(nota);
            }
        });

        for (let vazio = 0; vazio < primeiroDia; vazio++) {
            const celula = document.createElement('div');
            celula.className = 'calendar-day empty';
            grid.appendChild(celula);
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const celula = document.createElement('div');
            const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
            celula.className = `calendar-day${ehHoje ? ' today' : ''}`;
            celula.dataset.date = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            celula.tabIndex = 0;
            celula.setAttribute('role', 'button');
            celula.setAttribute('aria-label', `Ver detalhes de ${dia} de ${AppData.MESES[mesAtual]} de ${anoAtual}`);

            const numero = document.createElement('span');
            numero.className = 'calendar-day-number';
            numero.textContent = dia;
            celula.appendChild(numero);

            (aniversariosPorDia[dia] || []).forEach(aniversario => {
                const evento = document.createElement('div');
                evento.className = 'calendar-event';
                evento.title = `${aniversario.nome} - ${aniversario.idade} anos`;
                evento.textContent = `🎂 ${aniversario.nome.split(' ')[0]} (${aniversario.idade})`;
                celula.appendChild(evento);
            });

            (notasPorDia[dia] || []).forEach(nota => {
                const eventoNota = document.createElement('div');
                eventoNota.className = 'calendar-event calendar-event-nota';
                eventoNota.title = nota.titulo;
                eventoNota.textContent = `📝 ${nota.titulo}`;
                celula.appendChild(eventoNota);
            });
            grid.appendChild(celula);
        }

        const resto = (primeiroDia + diasNoMes) % 7;
        if (resto > 0) {
            for (let vazio = 0; vazio < 7 - resto; vazio++) {
                const celula = document.createElement('div');
                celula.className = 'calendar-day empty';
                grid.appendChild(celula);
            }
        }

        renderizarListaDoMes();
        renderizarResumo();
    }

    function mostrarDetalhesDoDia(dataISO) {
        const [ano, mes, dia] = dataISO.split('-').map(Number);
        const dataSelecionada = new Date(ano, mes - 1, dia);
        const painel = document.getElementById('cal-dia-detalhes');
        const titulo = document.getElementById('cal-dia-titulo');
        const aniversariosContainer = document.getElementById('cal-dia-aniversarios');
        const notasContainer = document.getElementById('cal-dia-notas');
        const vazio = document.getElementById('cal-dia-vazio');
        const aniversarios = AppData.getAniversariosDoMes(mes - 1, ano)
            .filter(aniversario => aniversario.dia === dia);
        const notas = AppData.getNotasDoDia(dataISO);

        titulo.textContent = dataSelecionada.toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
        aniversariosContainer.replaceChildren();
        notasContainer.replaceChildren();
        vazio.hidden = aniversarios.length + notas.length > 0;

        aniversarios.forEach(aniversario => {
            const item = document.createElement('div');
            const nome = document.createElement('strong');
            const detalhes = document.createElement('p');
            item.className = 'border-bottom py-2';
            nome.textContent = aniversario.nome;
            detalhes.className = 'mb-0 text-muted small';
            detalhes.textContent = `${AppData.formatarDataBR(aniversario.dataNascimento)} · ${aniversario.idade} anos · ${aniversario.grupo}`;
            item.append(nome, detalhes);
            aniversariosContainer.appendChild(item);
        });

        notas.forEach(nota => {
            const item = document.createElement('div');
            const tituloNota = document.createElement('strong');
            const conteudo = document.createElement('p');
            item.className = 'border-bottom py-2';
            tituloNota.textContent = nota.titulo;
            conteudo.className = 'mb-0 text-muted';
            conteudo.textContent = nota.conteudo;
            item.append(tituloNota, conteudo);
            notasContainer.appendChild(item);
        });

        painel.hidden = false;
        painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderizarListaDoMes() {
        const container = document.getElementById('cal-lista-mes');
        const vazio = document.getElementById('cal-lista-mes-vazio');
        const tituloMes = document.getElementById('cal-mes-titulo');
        if (!container || !vazio || !tituloMes) return;

        tituloMes.textContent = `${AppData.MESES[mesAtual]} ${anoAtual}`;
        container.replaceChildren();
        const aniversarios = AppData.getAniversariosDoMes(mesAtual, anoAtual);
        vazio.style.display = aniversarios.length ? 'none' : 'block';

        aniversarios.forEach(aniversario => {
            const item = document.createElement('div');
            const texto = document.createElement('p');
            const data = document.createElement('strong');
            const grupo = document.createElement('span');
            item.className = 'col-12 mb-2';
            item.style.cssText = 'padding: 12px; border-left: 3px solid var(--accent-purple); background: rgba(157, 78, 221, 0.08);';
            data.textContent = `${String(aniversario.dia).padStart(2, '0')} de ${AppData.MESES[mesAtual]}`;
            texto.className = 'mb-1';
            texto.append(data);
            const nome = document.createElement('span');
            nome.textContent = `${aniversario.nome} - ${aniversario.idade} anos`;
            texto.append(document.createElement('br'), nome);
            grupo.className = 'badge';
            grupo.style.backgroundColor = 'var(--accent-purple)';
            grupo.textContent = aniversario.grupo;
            item.append(texto, grupo);
            container.appendChild(item);
        });
    }

    function renderizarResumo() {
        const container = document.getElementById('cal-resumo-meses');
        if (!container) return;

        const resumo = AppData.getAniversariosPorMesResumo();
        container.replaceChildren();
        mesesAbreviados.forEach((mes, indice) => {
            const coluna = document.createElement('div');
            const item = document.createElement('div');
            const nome = document.createElement('div');
            const total = document.createElement('div');
            const ehAtual = indice === mesAtual;
            coluna.className = 'col-md-3 col-4';
            item.className = 'text-center p-2 rounded-3';
            item.style.background = `rgba(157, 78, 221, ${ehAtual ? '0.15' : '0.06'})`;
            if (ehAtual) item.style.border = '1px solid rgba(157, 78, 221, 0.3)';
            nome.style.fontWeight = '600';
            nome.textContent = mes;
            total.style.cssText = 'font-size: 1.2rem; font-weight: 700; color: var(--accent-purple);';
            total.textContent = resumo[indice];
            item.append(nome, total);
            coluna.appendChild(item);
            container.appendChild(coluna);
        });
    }

    document.addEventListener('app:fragment-loaded', event => {
        if (event.detail.path.endsWith('Calendario.html')) renderizarCalendario();
    });

    document.addEventListener('click', event => {
        const dia = event.target.closest('.calendar-day[data-date]');
        if (dia) {
            mostrarDetalhesDoDia(dia.dataset.date);
        } else if (event.target.closest('#cal-dia-fechar')) {
            document.getElementById('cal-dia-detalhes').hidden = true;
        } else if (event.target.closest('#cal-prev')) {
            document.getElementById('cal-dia-detalhes').hidden = true;
            mesAtual--;
            if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
            renderizarCalendario();
        } else if (event.target.closest('#cal-next')) {
            document.getElementById('cal-dia-detalhes').hidden = true;
            mesAtual++;
            if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
            renderizarCalendario();
        }
    });

    document.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.calendar-day[data-date]')) {
            event.preventDefault();
            mostrarDetalhesDoDia(event.target.dataset.date);
        }
    });
});