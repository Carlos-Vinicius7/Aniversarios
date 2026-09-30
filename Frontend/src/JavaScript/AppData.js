/**
 * AppData.js
 * Módulo central de dados — persiste aniversários e notas no localStorage.
 * Todas as páginas (Dashboard, Calendário, Aniversários, Notas) consomem este módulo.
 */

const AppData = (() => {
    const ANIVERSARIOS_KEY = 'aniversarios';
    const NOTAS_KEY = 'notas';
    const ATIVIDADES_KEY = 'atividades';

    // ========================
    // HELPERS
    // ========================
    const MESES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    function parseDataNascimento(dataISO) {
        const [ano, mes, dia] = dataISO.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function calcularIdade(dataNascimento) {
        const hoje = new Date();
        const nasc = parseDataNascimento(dataNascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
            idade--;
        }
        return idade;
    }

    function calcularDiasRestantes(dataNascimento) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const nasc = parseDataNascimento(dataNascimento);
        let proximo = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
        if (proximo < hoje) {
            proximo = new Date(hoje.getFullYear() + 1, nasc.getMonth(), nasc.getDate());
        }
        const diff = proximo - hoje;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    function formatarDataBR(dataISO) {
        const partes = dataISO.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatarDataExtenso(dataISO) {
        const partes = dataISO.split('-');
        const dia = parseInt(partes[2], 10);
        const mes = parseInt(partes[1], 10) - 1;
        return `${String(dia).padStart(2, '0')} de ${MESES[mes]}`;
    }

    function tempoAtras(dataISO) {
        const agora = new Date();
        const data = new Date(dataISO);
        const diffMs = agora - data;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Agora mesmo';
        if (diffMin < 60) return `Há ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `Há ${diffH}h`;
        const diffD = Math.floor(diffH / 24);
        if (diffD === 1) return 'Ontem';
        return `Há ${diffD} dias`;
    }

    // ========================
    // ANIVERSÁRIOS
    // ========================
    function getAniversarios() {
        return JSON.parse(localStorage.getItem(ANIVERSARIOS_KEY) || '[]');
    }

    function salvarAniversarios(lista) {
        localStorage.setItem(ANIVERSARIOS_KEY, JSON.stringify(lista));
    }

    function adicionarAniversario(dados) {
        const lista = getAniversarios();
        const novo = {
            id: Date.now().toString(),
            nome: dados.nome,
            dataNascimento: dados.dataNascimento,
            grupo: dados.grupo || 'Geral',
            criadoEm: new Date().toISOString()
        };
        lista.push(novo);
        salvarAniversarios(lista);
        adicionarAtividade(`Novo aniversário adicionado: <strong>${dados.nome}</strong>`);
        return novo;
    }

    function atualizarAniversario(id, dados) {
        const lista = getAniversarios();
        const indice = lista.findIndex(aniversario => aniversario.id === id);
        if (indice < 0) return null;

        lista[indice] = {
            ...lista[indice],
            nome: dados.nome,
            dataNascimento: dados.dataNascimento,
            grupo: dados.grupo || 'Geral'
        };
        salvarAniversarios(lista);
        adicionarAtividade(`Aniversário atualizado: <strong>${dados.nome}</strong>`);
        return lista[indice];
    }

    function removerAniversario(id) {
        let lista = getAniversarios();
        const removido = lista.find(a => a.id === id);
        lista = lista.filter(a => a.id !== id);
        salvarAniversarios(lista);
        if (removido) {
            adicionarAtividade(`Aniversário removido: <strong>${removido.nome}</strong>`);
        }
    }

    function getProximosAniversarios(limite) {
        const lista = getAniversarios();
        const comDias = lista.map(a => ({
            ...a,
            diasRestantes: calcularDiasRestantes(a.dataNascimento),
            idade: calcularIdade(a.dataNascimento)
        }));
        comDias.sort((a, b) => a.diasRestantes - b.diasRestantes);
        return limite ? comDias.slice(0, limite) : comDias;
    }

    function getAniversariosDoMes(mes, ano) {
        const lista = getAniversarios();
        return lista.filter(a => {
            const d = parseDataNascimento(a.dataNascimento);
            return d.getMonth() === mes;
        }).map(a => ({
            ...a,
            idade: calcularIdade(a.dataNascimento),
            dia: parseDataNascimento(a.dataNascimento).getDate()
        })).sort((a, b) => a.dia - b.dia);
    }

    function getAniversariosPorMesResumo() {
        const lista = getAniversarios();
        const resumo = new Array(12).fill(0);
        lista.forEach(a => {
            const mes = parseDataNascimento(a.dataNascimento).getMonth();
            resumo[mes]++;
        });
        return resumo;
    }

    function getEstatisticas() {
        const lista = getAniversarios();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const fimSemana = new Date(hoje);
        fimSemana.setDate(fimSemana.getDate() + 7);

        let estaSemana = 0;
        lista.forEach(a => {
            const nasc = parseDataNascimento(a.dataNascimento);
            let prox = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
            if (prox < hoje) prox.setFullYear(prox.getFullYear() + 1);
            if (prox >= hoje && prox <= fimSemana) estaSemana++;
        });

        const grupos = new Set(lista.map(a => a.grupo));

        return {
            total: lista.length,
            estaSemana: estaSemana,
            notas: getNotas().length,
            grupos: grupos.size
        };
    }

    // ========================
    // NOTAS
    // ========================
    function getNotas() {
        return JSON.parse(localStorage.getItem(NOTAS_KEY) || '[]');
    }

    function salvarNotas(lista) {
        localStorage.setItem(NOTAS_KEY, JSON.stringify(lista));
    }

    function adicionarNota(dados) {
        const lista = getNotas();
        const nova = {
            id: Date.now().toString(),
            titulo: dados.titulo,
            conteudo: dados.conteudo,
            criadoEm: new Date().toISOString()
        };
        lista.unshift(nova);
        salvarNotas(lista);
        adicionarAtividade(`Nova nota criada: <strong>${dados.titulo}</strong>`);
        return nova;
    }

    function atualizarNota(id, dados) {
        const lista = getNotas();
        const indice = lista.findIndex(nota => nota.id === id);
        if (indice < 0) return null;

        lista[indice] = {
            ...lista[indice],
            titulo: dados.titulo,
            conteudo: dados.conteudo,
            atualizadoEm: new Date().toISOString()
        };
        salvarNotas(lista);
        adicionarAtividade(`Nota atualizada: <strong>${dados.titulo}</strong>`);
        return lista[indice];
    }

    function removerNota(id) {
        let lista = getNotas();
        const removida = lista.find(n => n.id === id);
        lista = lista.filter(n => n.id !== id);
        salvarNotas(lista);
        if (removida) {
            adicionarAtividade(`Nota removida: <strong>${removida.titulo}</strong>`);
        }
    }

    // ========================
    // ATIVIDADES RECENTES
    // ========================
    function getAtividades() {
        return JSON.parse(localStorage.getItem(ATIVIDADES_KEY) || '[]');
    }

    function adicionarAtividade(descricao) {
        const lista = getAtividades();
        lista.unshift({
            descricao: descricao,
            data: new Date().toISOString()
        });
        // Manter apenas as últimas 20
        if (lista.length > 20) lista.length = 20;
        localStorage.setItem(ATIVIDADES_KEY, JSON.stringify(lista));
    }

    // ========================
    // API PÚBLICA
    // ========================
    return {
        // Aniversários
        getAniversarios,
        adicionarAniversario,
        atualizarAniversario,
        removerAniversario,
        getProximosAniversarios,
        getAniversariosDoMes,
        getAniversariosPorMesResumo,
        getEstatisticas,
        // Notas
        getNotas,
        adicionarNota,
        atualizarNota,
        removerNota,
        // Atividades
        getAtividades,
        // Helpers
        calcularIdade,
        calcularDiasRestantes,
        formatarDataBR,
        formatarDataExtenso,
        tempoAtras,
        MESES
    };
})();
