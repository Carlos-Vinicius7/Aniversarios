/**
 * Central data module. Persistent application data is always loaded from the PHP API.
 */
const AppData = (() => {
    const API_URL = new URL('../../../../Backend/src/index.php', document.baseURI);
    const MESES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    let aniversarios = [];
    let notas = [];
    let atividades = [];
    let usuario = null;
    let preferencias = {
        notificacao_email: false,
        notificacao_push: false,
        lembrete_3_dias: false,
        lembrete_no_dia: false
    };

    async function requisitar(rota, metodo = 'GET', dados = null) {
        const url = new URL(API_URL);
        url.searchParams.set('rota', rota);
        const opcoes = {
            method: metodo,
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        };
        if (dados !== null) {
            opcoes.headers['Content-Type'] = 'application/json';
            opcoes.body = JSON.stringify(dados);
        }

        let resposta;
        try {
            resposta = await fetch(url, opcoes);
        } catch {
            throw new Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
        }

        let resultado;
        try {
            resultado = await resposta.json();
        } catch {
            throw new Error('O servidor retornou uma resposta inválida.');
        }
        if (!resposta.ok) {
            const erro = new Error(resultado.erro || 'Não foi possível concluir a operação.');
            erro.statusCode = resposta.status;
            throw erro;
        }
        return resultado;
    }

    function entrar(email, senha) {
        return requisitar('auth.entrar', 'POST', { email, senha });
    }

    function registrar(nome, email, senha) {
        return requisitar('auth.registrar', 'POST', { nome, email, senha });
    }

    function sair() {
        return requisitar('auth.sair', 'POST');
    }

    function normalizarAniversario(item) {
        return {
            id: String(item.id),
            nome: item.nome,
            dataNascimento: item.dataNascimento || item.nascimento,
            grupo: item.grupo
        };
    }

    function normalizarNota(item) {
        return {
            id: String(item.id),
            titulo: item.titulo,
            conteudo: item.conteudo,
            data: item.data
        };
    }

    async function consultarSessao() {
        return requisitar('auth.sessao');
    }

    async function carregarDados() {
        const dados = await requisitar('app.dados');
        aniversarios = dados.aniversarios.map(normalizarAniversario);
        notas = dados.notas.map(normalizarNota);
        atividades = dados.atividades;
        usuario = dados.usuario;
        preferencias = dados.preferencias;
        return dados.usuario;
    }

    function getUsuario() {
        return usuario;
    }

    async function atualizarPerfil(dados) {
        const resultado = await requisitar('conta.perfil', 'PUT', dados);
        usuario = resultado.usuario;
        return usuario;
    }

    function getPreferencias() {
        return preferencias;
    }

    async function atualizarPreferencias(dados) {
        const resultado = await requisitar('conta.preferencias', 'PUT', dados);
        preferencias = resultado.preferencias;
        return preferencias;
    }

    function parseDataNascimento(dataISO) {
        const [ano, mes, dia] = dataISO.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function calcularIdade(dataNascimento) {
        const hoje = new Date();
        const nasc = parseDataNascimento(dataNascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        if (hoje.getMonth() < nasc.getMonth()
            || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
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
        return Math.ceil((proximo - hoje) / (1000 * 60 * 60 * 24));
    }

    function formatarDataBR(dataISO) {
        const [ano, mes, dia] = dataISO.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function formatarDataExtenso(dataISO) {
        const [ano, mes, dia] = dataISO.split('-');
        return `${String(Number(dia)).padStart(2, '0')} de ${MESES[Number(mes) - 1]}`;
    }

    function tempoAtras(dataISO) {
        const instante = dataISO.includes(' ') ? dataISO.replace(' ', 'T') : dataISO;
        const diffMin = Math.floor((Date.now() - new Date(instante).getTime()) / 60000);
        if (diffMin < 1) return 'Agora mesmo';
        if (diffMin < 60) return `Há ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `Há ${diffH}h`;
        const diffD = Math.floor(diffH / 24);
        if (diffD === 1) return 'Ontem';
        return `Há ${diffD} dias`;
    }

    function getAniversarios() {
        return aniversarios;
    }

    async function adicionarAniversario(dados) {
        const resultado = await requisitar('aniversarios.criar', 'POST', dados);
        const aniversario = normalizarAniversario(resultado.aniversario);
        aniversarios.push(aniversario);
        return aniversario;
    }

    async function atualizarAniversario(id, dados) {
        const resultado = await requisitar('aniversarios.editar', 'PUT', { ...dados, id });
        const atualizado = normalizarAniversario(resultado.aniversario);
        aniversarios = aniversarios.map(item => item.id === String(id) ? atualizado : item);
        return atualizado;
    }

    async function removerAniversario(id) {
        await requisitar('aniversarios.excluir', 'DELETE', { id });
        aniversarios = aniversarios.filter(item => item.id !== String(id));
    }

    function getProximosAniversarios(limite) {
        const lista = aniversarios.map(item => ({
            ...item,
            diasRestantes: calcularDiasRestantes(item.dataNascimento),
            idade: calcularIdade(item.dataNascimento)
        })).sort((a, b) => a.diasRestantes - b.diasRestantes);
        return limite ? lista.slice(0, limite) : lista;
    }

    function getAniversariosDoMes(mes) {
        return aniversarios.filter(item => parseDataNascimento(item.dataNascimento).getMonth() === mes)
            .map(item => ({
                ...item,
                idade: calcularIdade(item.dataNascimento),
                dia: parseDataNascimento(item.dataNascimento).getDate()
            }))
            .sort((a, b) => a.dia - b.dia);
    }

    function getAniversariosPorMesResumo() {
        const resumo = new Array(12).fill(0);
        aniversarios.forEach(item => resumo[parseDataNascimento(item.dataNascimento).getMonth()]++);
        return resumo;
    }

    function getEstatisticas() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const fimSemana = new Date(hoje);
        fimSemana.setDate(fimSemana.getDate() + 7);
        const estaSemana = aniversarios.filter(item => {
            const nascimento = parseDataNascimento(item.dataNascimento);
            let proximo = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate());
            if (proximo < hoje) proximo.setFullYear(proximo.getFullYear() + 1);
            return proximo >= hoje && proximo <= fimSemana;
        }).length;

        return {
            total: aniversarios.length,
            estaSemana,
            notas: notas.length,
            grupos: new Set(aniversarios.map(item => item.grupo)).size
        };
    }

    function getNotas() {
        return notas;
    }

    async function adicionarNota(dados) {
        const resultado = await requisitar('notas.criar', 'POST', dados);
        const nota = normalizarNota(resultado.nota);
        notas.unshift(nota);
        return nota;
    }

    async function atualizarNota(id, dados) {
        const resultado = await requisitar('notas.editar', 'PUT', { ...dados, id });
        const atualizada = normalizarNota(resultado.nota);
        notas = notas.map(item => item.id === String(id) ? atualizada : item);
        return atualizada;
    }

    function getNotasDoDia(dataISO) {
        return notas.filter(nota => nota.data === dataISO);
    }

    async function removerNota(id) {
        await requisitar('notas.excluir', 'DELETE', { id });
        notas = notas.filter(item => item.id !== String(id));
    }

    function getAtividades() {
        return atividades;
    }

    return {
        entrar,
        registrar,
        sair,
        consultarSessao,
        carregarDados,
        getUsuario,
        atualizarPerfil,
        getPreferencias,
        atualizarPreferencias,
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
        getNotasDoDia,
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
