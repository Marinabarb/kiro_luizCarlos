/* ═══════════════════════════════════════════════════════════
   app.js — Sistema de Controle Comercial v2
   Módulos: Auth, Dashboard, Caixa, Produtos, Usuários
═══════════════════════════════════════════════════════════ */

'use strict';

// ────────────────────────────────────────────────────────────
// DETECÇÃO DE AMBIENTE
// Se aberto como file:// (sem servidor), avisa o usuário.
// ────────────────────────────────────────────────────────────
(function verificarAmbiente() {
  if (window.location.protocol === 'file:') {
    document.body.innerHTML =
      '<div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1e3a5f;padding:1rem">' +
      '<div style="background:#fff;border-radius:12px;padding:2rem;max-width:420px;text-align:center">' +
      '<div style="font-size:3rem">⚠️</div>' +
      '<h2 style="margin:.5rem 0">Abra pelo servidor</h2>' +
      '<p style="color:#475569;margin-bottom:1.2rem">Este sistema não funciona quando aberto como arquivo local.<br>Execute o servidor e acesse pelo navegador:</p>' +
      '<code style="background:#f1f5f9;padding:.75rem 1rem;border-radius:8px;display:block;font-size:1rem;margin-bottom:1.2rem">http://localhost:3000</code>' +
      '<p style="color:#64748b;font-size:.85rem">No terminal do projeto, rode:<br><strong>npm start</strong></p>' +
      '</div></div>';
    return;
  }
})();

// ────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ────────────────────────────────────────────────────────────
const Estado = {
  token  : localStorage.getItem('token') || null,
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
};

// ────────────────────────────────────────────────────────────
// WRAPPER DE FETCH
// Usa URL absoluta baseada no host atual para funcionar em
// qualquer porta (localhost:3000, Replit, etc.)
// ────────────────────────────────────────────────────────────
var BASE_URL = window.location.origin;

async function api(metodo, rota, corpo) {
  const opts = {
    method : metodo,
    headers: { 'Content-Type': 'application/json' },
  };
  if (Estado.token) {
    opts.headers['Authorization'] = 'Bearer ' + Estado.token;
  }
  if (corpo) {
    opts.body = JSON.stringify(corpo);
  }

  let res, json;
  try {
    res  = await fetch(BASE_URL + '/api' + rota, opts);
    json = await res.json().catch(function() { return {}; });
  } catch (err) {
    throw new Error(
      'Não foi possível conectar ao servidor.\n' +
      'Certifique-se de que está acessando via http://localhost:3000 e que o servidor está rodando (npm start).'
    );
  }

  if (res.status === 401) {
    sair();
    return null;
  }
  if (!res.ok) {
    throw new Error(json.erro || 'Erro inesperado (' + res.status + ').');
  }
  return json;
}

// ────────────────────────────────────────────────────────────
// UTILITÁRIOS DE FORMATAÇÃO
// ────────────────────────────────────────────────────────────
const fmt = {
  moeda(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
  data(s) {
    if (!s) return '—';
    const d = s.split('T')[0];
    const [a, m, dia] = d.split('-');
    return dia + '/' + m + '/' + a;
  },
  escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

// ────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────
let _toastTimer;
function toast(msg, tipo) {
  tipo = tipo || 'sucesso';
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast toast--' + tipo + ' visivel';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.className = 'toast'; }, 3500);
}

// ────────────────────────────────────────────────────────────
// MODAL
// ────────────────────────────────────────────────────────────
function abrirModal(titulo, html) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-corpo').innerHTML    = html;
  document.getElementById('modal').style.display      = 'flex';
  var primeiro = document.getElementById('modal-corpo').querySelector('input, select, textarea');
  if (primeiro) setTimeout(function() { primeiro.focus(); }, 60);
}

function fecharModal() {
  document.getElementById('modal').style.display   = 'none';
  document.getElementById('modal-corpo').innerHTML = '';
}

document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === document.getElementById('modal')) fecharModal();
});

// ════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════

document.getElementById('form-login').addEventListener('submit', async function(e) {
  e.preventDefault();

  var btn   = document.getElementById('btn-login');
  var erroEl = document.getElementById('login-erro');
  var email = document.getElementById('login-email').value.trim();
  var senha = document.getElementById('login-senha').value;

  erroEl.style.display = 'none';
  btn.disabled         = true;
  btn.textContent      = 'Entrando…';

  try {
    var dados = await api('POST', '/auth/login', { email: email, senha: senha });
    if (!dados) return;

    Estado.token   = dados.token;
    Estado.usuario = dados.usuario;
    localStorage.setItem('token',   dados.token);
    localStorage.setItem('usuario', JSON.stringify(dados.usuario));

    iniciarApp();
  } catch (err) {
    erroEl.textContent   = err.message;
    erroEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Entrar';
  }
});

function sair() {
  if (Estado.token) {
    fetch('/api/auth/logout', {
      method : 'POST',
      headers: { 'Authorization': 'Bearer ' + Estado.token },
    }).catch(function() {});
  }
  Estado.token   = null;
  Estado.usuario = null;
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  document.getElementById('app').style.display        = 'none';
  document.getElementById('tela-login').style.display = 'flex';
  document.getElementById('login-senha').value        = '';
  document.getElementById('login-erro').style.display = 'none';
}

document.getElementById('btn-logout').addEventListener('click', sair);

function iniciarApp() {
  document.getElementById('tela-login').style.display = 'none';
  document.getElementById('app').style.display        = 'flex';

  document.getElementById('sidebar-nome').textContent = Estado.usuario.nome;
  document.getElementById('sidebar-tipo').textContent =
    Estado.usuario.tipo_usuario === 'ADMIN' ? '🔑 Administrador' : '👤 Usuário';

  var isAdmin = Estado.usuario.tipo_usuario === 'ADMIN';
  document.querySelectorAll('.admin-only').forEach(function(el) {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('.nav-item--admin').forEach(function(el) {
    el.style.display = isAdmin ? '' : 'none';
  });

  navegarPara('dashboard');
}

// Restaurar sessão ao recarregar a página
if (Estado.token && Estado.usuario) {
  iniciarApp();
}

// ════════════════════════════════════════════════════════════
// TELA INICIAL — ABAS LOGIN / CADASTRO
// ════════════════════════════════════════════════════════════

// Alternar entre painéis
document.getElementById('aba-login').addEventListener('click', function() {
  document.getElementById('aba-login').classList.add('ativa');
  document.getElementById('aba-cadastro').classList.remove('ativa');
  document.getElementById('painel-login').style.display    = 'block';
  document.getElementById('painel-cadastro').style.display = 'none';
  document.getElementById('login-erro').style.display = 'none';
});

document.getElementById('aba-cadastro').addEventListener('click', function() {
  document.getElementById('aba-cadastro').classList.add('ativa');
  document.getElementById('aba-login').classList.remove('ativa');
  document.getElementById('painel-cadastro').style.display = 'block';
  document.getElementById('painel-login').style.display    = 'none';
  document.getElementById('cad-erro').style.display = 'none';
  document.getElementById('cad-ok').style.display   = 'none';
  setTimeout(function() { document.getElementById('cad-nome').focus(); }, 60);
});

// Mostrar/ocultar senha — login
document.getElementById('olho-login').addEventListener('click', function() {
  var inp = document.getElementById('login-senha');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  this.style.opacity = inp.type === 'text' ? '1' : '0.5';
});

// Mostrar/ocultar senha — cadastro
document.getElementById('olho-cad').addEventListener('click', function() {
  var inp = document.getElementById('cad-senha');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  this.style.opacity = inp.type === 'text' ? '1' : '0.5';
});
document.getElementById('olho-conf').addEventListener('click', function() {
  var inp = document.getElementById('cad-confirma');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  this.style.opacity = inp.type === 'text' ? '1' : '0.5';
});

// ── Formulário de cadastro ─────────────────────────────────
document.getElementById('form-cadastro').addEventListener('submit', async function(e) {
  e.preventDefault();

  var btn      = document.getElementById('btn-cadastrar');
  var erroEl   = document.getElementById('cad-erro');
  var okEl     = document.getElementById('cad-ok');
  var nome     = document.getElementById('cad-nome').value.trim();
  var email    = document.getElementById('cad-email').value.trim();
  var telefone = document.getElementById('cad-telefone').value.trim();
  var senha    = document.getElementById('cad-senha').value;
  var confirma = document.getElementById('cad-confirma').value;

  erroEl.style.display = 'none';
  okEl.style.display   = 'none';

  // Validações no cliente
  if (!nome || nome.length < 2) {
    erroEl.textContent   = 'Informe seu nome completo (mín. 2 caracteres).';
    erroEl.style.display = 'block';
    document.getElementById('cad-nome').focus();
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erroEl.textContent   = 'Informe um e-mail válido.';
    erroEl.style.display = 'block';
    document.getElementById('cad-email').focus();
    return;
  }
  if (!senha || senha.length < 6) {
    erroEl.textContent   = 'A senha deve ter ao menos 6 caracteres.';
    erroEl.style.display = 'block';
    document.getElementById('cad-senha').focus();
    return;
  }
  if (senha !== confirma) {
    erroEl.textContent   = 'As senhas não coincidem.';
    erroEl.style.display = 'block';
    document.getElementById('cad-confirma').focus();
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Criando conta…';

  try {
    var dados = await api('POST', '/auth/cadastro', {
      nome     : nome,
      email    : email,
      senha    : senha,
      telefone : telefone || null,
    });

    // Sucesso — mostra mensagem e volta para aba de login
    okEl.textContent   = dados.mensagem || 'Conta criada! Faça login.';
    okEl.style.display = 'block';
    document.getElementById('form-cadastro').reset();

    // Preenche e-mail no login automaticamente e muda aba após 2s
    setTimeout(function() {
      document.getElementById('login-email').value = email;
      document.getElementById('aba-login').click();
      document.getElementById('login-senha').focus();
    }, 2000);

  } catch (err) {
    erroEl.textContent   = err.message;
    erroEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Criar conta';
  }
});

// ════════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════════════════════════

var titulos = {
  dashboard: 'Dashboard',
  caixa    : 'Fluxo de Caixa',
  produtos : 'Produtos',
  usuarios : 'Usuários',
};

function navegarPara(pagina) {
  document.querySelectorAll('.nav-item').forEach(function(a) {
    a.classList.toggle('ativo', a.dataset.pagina === pagina);
  });
  document.querySelectorAll('.pagina').forEach(function(s) {
    s.classList.toggle('ativa', s.id === 'pagina-' + pagina);
  });
  document.getElementById('topbar-titulo').textContent = titulos[pagina] || pagina;

  fecharSidebar();

  if (pagina === 'dashboard') carregarDashboard();
  if (pagina === 'caixa')     carregarCaixa();
  if (pagina === 'produtos')  carregarProdutos();
  if (pagina === 'usuarios')  carregarUsuarios();
}

document.querySelectorAll('.nav-item').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    navegarPara(a.dataset.pagina);
  });
});

function abrirSidebar() {
  document.getElementById('sidebar').classList.add('aberta');
  document.getElementById('overlay').classList.add('visivel');
}
function fecharSidebar() {
  document.getElementById('sidebar').classList.remove('aberta');
  document.getElementById('overlay').classList.remove('visivel');
}

document.getElementById('btn-menu').addEventListener('click', abrirSidebar);
document.getElementById('btn-fechar-menu').addEventListener('click', fecharSidebar);
document.getElementById('overlay').addEventListener('click', fecharSidebar);

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════

async function carregarDashboard() {
  try {
    var d = await api('GET', '/dashboard');
    if (!d) return;

    var corSaldo = d.saldo >= 0 ? 'var(--verde)' : 'var(--vermelho)';
    document.getElementById('cards-dashboard').innerHTML =
      '<div class="card-resumo">' +
        '<div class="card-resumo__label">Saldo em Caixa</div>' +
        '<div class="card-resumo__valor" style="color:' + corSaldo + '">' + fmt.moeda(d.saldo) + '</div>' +
        '<div class="card-resumo__icone">💰</div>' +
      '</div>' +
      '<div class="card-resumo card-resumo--verde">' +
        '<div class="card-resumo__label">Total Entradas</div>' +
        '<div class="card-resumo__valor" style="color:var(--verde)">' + fmt.moeda(d.total_entradas) + '</div>' +
        '<div class="card-resumo__icone">↑</div>' +
      '</div>' +
      '<div class="card-resumo card-resumo--vermelho">' +
        '<div class="card-resumo__label">Total Saídas</div>' +
        '<div class="card-resumo__valor" style="color:var(--vermelho)">' + fmt.moeda(d.total_saidas) + '</div>' +
        '<div class="card-resumo__icone">↓</div>' +
      '</div>' +
      '<div class="card-resumo card-resumo--amarelo">' +
        '<div class="card-resumo__label">Vendas Hoje</div>' +
        '<div class="card-resumo__valor">' + fmt.moeda(d.vendas_hoje) + '</div>' +
        '<div class="card-resumo__icone">🛒</div>' +
      '</div>' +
      '<div class="card-resumo">' +
        '<div class="card-resumo__label">Produtos</div>' +
        '<div class="card-resumo__valor">' + d.total_produtos + '</div>' +
        '<div class="card-resumo__icone">📦</div>' +
      '</div>' +
      '<div class="card-resumo card-resumo--amarelo">' +
        '<div class="card-resumo__label">Estoque Baixo</div>' +
        '<div class="card-resumo__valor" style="color:var(--amarelo)">' + d.estoque_baixo + '</div>' +
        '<div class="card-resumo__icone">⚠️</div>' +
      '</div>';

    renderizarGrafico(d.grafico_7dias);

    var ul = document.getElementById('lista-ultimas');
    if (!d.ultimas_movs || !d.ultimas_movs.length) {
      ul.innerHTML = '<li style="color:var(--cinza-400)">Nenhuma movimentação ainda.</li>';
    } else {
      ul.innerHTML = d.ultimas_movs.map(function(m) {
        var icone = m.tipo_movimentacao === 'entrada' ? '↑' : '↓';
        var cls   = 'ls-valor-' + m.tipo_movimentacao;
        var sinal = m.tipo_movimentacao === 'entrada' ? '+' : '-';
        return '<li>' +
          '<span>' + icone + '</span>' +
          '<span class="ls-desc">' + fmt.escape(m.descricao) + '</span>' +
          '<span class="' + cls + '">' + sinal + ' ' + fmt.moeda(m.valor) + '</span>' +
          '</li>';
      }).join('');
    }
  } catch (err) {
    toast('Erro ao carregar dashboard: ' + err.message, 'erro');
  }
}

function renderizarGrafico(dados) {
  var container = document.getElementById('grafico-container');
  if (!dados || !dados.length) {
    container.innerHTML = '<p style="color:var(--cinza-400);font-size:.8rem;align-self:center">Sem dados ainda</p>';
    return;
  }

  var maxVal = 1;
  dados.forEach(function(d) {
    if (d.entradas > maxVal) maxVal = d.entradas;
    if (d.saidas   > maxVal) maxVal = d.saidas;
  });

  container.innerHTML = dados.map(function(d) {
    var hE  = Math.max(2, Math.round((d.entradas / maxVal) * 100));
    var hS  = Math.max(2, Math.round((d.saidas   / maxVal) * 100));
    var dia = d.dia ? d.dia.slice(5) : '';
    return '<div class="grafico-col">' +
      '<div class="grafico-barra-wrap">' +
        '<div class="grafico-barra grafico-barra--entrada" style="height:' + hE + '%" title="Entradas: ' + fmt.moeda(d.entradas) + '"></div>' +
        '<div class="grafico-barra grafico-barra--saida" style="height:' + hS + '%" title="Saídas: ' + fmt.moeda(d.saidas) + '"></div>' +
      '</div>' +
      '<div class="grafico-label">' + dia + '</div>' +
    '</div>';
  }).join('');
}

// ════════════════════════════════════════════════════════════
// FLUXO DE CAIXA
// ════════════════════════════════════════════════════════════

function getFiltrosCaixa() {
  var params = {};
  var ini  = document.getElementById('filtro-inicio').value;
  var fim  = document.getElementById('filtro-fim').value;
  var tipo = document.getElementById('filtro-tipo').value;
  if (ini)  params.inicio = ini;
  if (fim)  params.fim    = fim;
  if (tipo) params.tipo   = tipo;
  return Object.keys(params).length ? params : null;
}

async function carregarCaixa(params) {
  try {
    var qs = params ? ('?' + new URLSearchParams(params).toString()) : '';
    var resultado = await Promise.all([
      api('GET', '/caixa' + qs),
      api('GET', '/caixa/resumo' + qs),
    ]);
    var movs   = resultado[0];
    var resumo = resultado[1];
    if (!movs || !resumo) return;

    var corSaldo = resumo.saldo >= 0 ? 'var(--verde)' : 'var(--vermelho)';
    document.getElementById('cards-caixa').innerHTML =
      '<div class="card-resumo">' +
        '<div class="card-resumo__label">Saldo</div>' +
        '<div class="card-resumo__valor" style="color:' + corSaldo + '">' + fmt.moeda(resumo.saldo) + '</div>' +
      '</div>' +
      '<div class="card-resumo card-resumo--verde">' +
        '<div class="card-resumo__label">Entradas</div>' +
        '<div class="card-resumo__valor" style="color:var(--verde)">' + fmt.moeda(resumo.total_entradas) + '</div>' +
      '</div>' +
      '<div class="card-resumo card-resumo--vermelho">' +
        '<div class="card-resumo__label">Saídas</div>' +
        '<div class="card-resumo__valor" style="color:var(--vermelho)">' + fmt.moeda(resumo.total_saidas) + '</div>' +
      '</div>';

    var tbody   = document.getElementById('tbody-caixa');
    var isAdmin = Estado.usuario.tipo_usuario === 'ADMIN';

    if (!movs.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--cinza-400);padding:2rem">Nenhuma movimentação encontrada.</td></tr>';
      return;
    }

    tbody.innerHTML = movs.map(function(m) {
      var isEntrada = m.tipo_movimentacao === 'entrada';
      var badgeTipo = isEntrada ? 'badge--verde' : 'badge--vermelho';
      var labelTipo = isEntrada ? '↑ Entrada' : '↓ Saída';
      var corValor  = isEntrada ? 'var(--verde)' : 'var(--vermelho)';
      var sinalVal  = isEntrada ? '+' : '-';
      var acoes     = isAdmin
        ? '<button class="btn btn--sm btn--perigo" onclick="excluirCaixa(' + m.id + ')">Remover</button>'
        : '—';
      return '<tr>' +
        '<td>' + fmt.data(m.data_movimentacao) + '</td>' +
        '<td>' + fmt.escape(m.descricao) + '</td>' +
        '<td><span class="badge badge--azul">' + fmt.escape(m.categoria) + '</span></td>' +
        '<td>' + fmt.escape(m.forma_pagamento) + '</td>' +
        '<td><span class="badge ' + badgeTipo + '">' + labelTipo + '</span></td>' +
        '<td style="font-weight:700;color:' + corValor + '">' + sinalVal + ' ' + fmt.moeda(m.valor) + '</td>' +
        '<td>' + acoes + '</td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    toast('Erro ao carregar caixa: ' + err.message, 'erro');
  }
}

document.getElementById('btn-filtrar-caixa').addEventListener('click', function() {
  carregarCaixa(getFiltrosCaixa());
});

document.getElementById('btn-nova-mov').addEventListener('click', function() {
  abrirModal('Nova Movimentação',
    '<div class="campo">' +
      '<label>Tipo</label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">' +
        '<button type="button" class="btn btn--secundario btn-tipo-mov" data-tipo="entrada" id="btTipoEntrada" style="border-color:var(--verde);color:var(--verde)">↑ Entrada</button>' +
        '<button type="button" class="btn btn--secundario btn-tipo-mov" data-tipo="saida"   id="btTipoSaida">↓ Saída</button>' +
      '</div>' +
      '<input type="hidden" id="m-tipo" value="entrada" />' +
    '</div>' +
    '<div class="campo"><label>Descrição *</label><input type="text" id="m-desc" placeholder="Ex: Venda do dia, Conta de luz…" /></div>' +
    '<div class="campo-grupo">' +
      '<div class="campo"><label>Valor (R$) *</label><input type="number" id="m-valor" min="0.01" step="0.01" placeholder="0,00" /></div>' +
      '<div class="campo"><label>Categoria</label>' +
        '<select id="m-cat">' +
          '<option value="vendas">Vendas</option>' +
          '<option value="recebimentos">Recebimentos</option>' +
          '<option value="depositos">Depósitos</option>' +
          '<option value="despesas">Despesas</option>' +
          '<option value="fornecedores">Fornecedores</option>' +
          '<option value="contas">Contas</option>' +
          '<option value="outros">Outros</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="campo"><label>Forma de Pagamento</label>' +
      '<select id="m-pgto">' +
        '<option value="dinheiro">Dinheiro</option>' +
        '<option value="pix">PIX</option>' +
        '<option value="cartao_debito">Cartão Débito</option>' +
        '<option value="cartao_credito">Cartão Crédito</option>' +
        '<option value="transferencia">Transferência</option>' +
        '<option value="boleto">Boleto</option>' +
      '</select>' +
    '</div>' +
    '<div id="mov-erro" class="alerta alerta--erro" style="display:none"></div>' +
    '<div class="modal-acoes">' +
      '<button class="btn btn--secundario" onclick="fecharModal()">Cancelar</button>' +
      '<button class="btn btn--primario" id="btn-salvar-mov">Salvar</button>' +
    '</div>'
  );

  // Lógica dos botões de tipo
  document.querySelectorAll('.btn-tipo-mov').forEach(function(b) {
    b.addEventListener('click', function() {
      document.querySelectorAll('.btn-tipo-mov').forEach(function(x) {
        x.style.borderColor = '';
        x.style.color = '';
      });
      document.getElementById('m-tipo').value = b.dataset.tipo;
      if (b.dataset.tipo === 'entrada') {
        b.style.borderColor = 'var(--verde)';
        b.style.color = 'var(--verde)';
      } else {
        b.style.borderColor = 'var(--vermelho)';
        b.style.color = 'var(--vermelho)';
      }
    });
  });

  document.getElementById('btn-salvar-mov').addEventListener('click', salvarMovimentacao);
});

async function salvarMovimentacao() {
  var tipo            = document.getElementById('m-tipo').value;
  var descricao       = document.getElementById('m-desc').value.trim();
  var valor           = document.getElementById('m-valor').value;
  var categoria       = document.getElementById('m-cat').value;
  var forma_pagamento = document.getElementById('m-pgto').value;
  var erroEl          = document.getElementById('mov-erro');

  erroEl.style.display = 'none';
  if (!descricao || !valor) {
    erroEl.textContent   = 'Preencha descrição e valor.';
    erroEl.style.display = 'block';
    return;
  }

  try {
    await api('POST', '/caixa', {
      tipo_movimentacao: tipo,
      descricao        : descricao,
      valor            : parseFloat(valor),
      categoria        : categoria,
      forma_pagamento  : forma_pagamento,
    });
    fecharModal();
    toast('Movimentação registrada!');
    carregarCaixa(getFiltrosCaixa());
    // Atualiza dashboard se visível
    if (document.getElementById('pagina-dashboard').classList.contains('ativa')) {
      carregarDashboard();
    }
  } catch (err) {
    erroEl.textContent   = err.message;
    erroEl.style.display = 'block';
  }
}

async function excluirCaixa(id) {
  if (!confirm('Remover esta movimentação? Esta ação não pode ser desfeita.')) return;
  try {
    await api('DELETE', '/caixa/' + id);
    toast('Movimentação removida.');
    carregarCaixa(getFiltrosCaixa());
  } catch (err) {
    toast(err.message, 'erro');
  }
}

// ════════════════════════════════════════════════════════════
// PRODUTOS
// ════════════════════════════════════════════════════════════

async function carregarProdutos() {
  try {
    var cats = await api('GET', '/produtos/categorias');
    var sel  = document.getElementById('filtro-categoria');
    sel.innerHTML = '<option value="">Todas as categorias</option>';
    if (cats && cats.length) {
      cats.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value       = c;
        opt.textContent = c;
        sel.appendChild(opt);
      });
    }
    await buscarProdutos();
  } catch (err) {
    toast('Erro ao carregar produtos: ' + err.message, 'erro');
  }
}

async function buscarProdutos() {
  var params = {};
  var busca  = document.getElementById('busca-produto').value.trim();
  var cat    = document.getElementById('filtro-categoria').value;
  var baixo  = document.getElementById('filtro-estoque-baixo').checked;
  if (busca) params.busca         = busca;
  if (cat)   params.categoria     = cat;
  if (baixo) params.estoque_baixo = '1';

  var qs = Object.keys(params).length ? ('?' + new URLSearchParams(params).toString()) : '';

  try {
    var produtos = await api('GET', '/produtos' + qs);
    if (!produtos) return;

    var tbody   = document.getElementById('tbody-produtos');
    var isAdmin = Estado.usuario.tipo_usuario === 'ADMIN';

    if (!produtos.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--cinza-400);padding:2rem">Nenhum produto encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = produtos.map(function(p) {
      var alertaBaixo = p.quantidade_estoque <= p.estoque_minimo;
      var badgeEst    = alertaBaixo ? 'badge--amarelo' : 'badge--verde';
      var iconeEst    = alertaBaixo ? ' ⚠️' : '';
      var badgeSt     = p.status ? 'badge--verde' : 'badge--vermelho';
      var labelSt     = p.status ? 'Ativo' : 'Inativo';
      var fornec      = p.fornecedor ? '<br><small style="color:var(--cinza-400)">' + fmt.escape(p.fornecedor) + '</small>' : '';
      var acoes       = isAdmin
        ? '<button class="btn btn--sm btn--secundario" onclick="editarProduto(' + p.id + ')" style="margin-right:.3rem">Editar</button>' +
          '<button class="btn btn--sm btn--perigo" onclick="excluirProduto(' + p.id + ')">Remover</button>'
        : '';
      return '<tr class="' + (alertaBaixo ? 'estoque-baixo' : '') + '">' +
        '<td><strong>' + fmt.escape(p.nome_produto) + '</strong>' + fornec + '</td>' +
        '<td>' + (p.categoria ? '<span class="badge badge--azul">' + fmt.escape(p.categoria) + '</span>' : '—') + '</td>' +
        '<td style="font-family:monospace">' + (p.codigo_barras || '—') + '</td>' +
        '<td>' + fmt.moeda(p.preco_custo) + '</td>' +
        '<td><strong>' + fmt.moeda(p.preco_venda) + '</strong></td>' +
        '<td><span class="badge ' + badgeEst + '">' + p.quantidade_estoque + iconeEst + '</span> <small style="color:var(--cinza-400)">/ mín ' + p.estoque_minimo + '</small></td>' +
        '<td><span class="badge ' + badgeSt + '">' + labelSt + '</span></td>' +
        '<td class="admin-only" style="' + (isAdmin ? '' : 'display:none') + '">' + acoes + '</td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    toast('Erro ao buscar produtos: ' + err.message, 'erro');
  }
}

document.getElementById('btn-buscar-produto').addEventListener('click', buscarProdutos);
document.getElementById('busca-produto').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') buscarProdutos();
});

function htmlFormProduto(p) {
  var n  = p ? fmt.escape(p.nome_produto)  : '';
  var cb = p && p.codigo_barras ? fmt.escape(p.codigo_barras) : '';
  var ct = p && p.categoria     ? fmt.escape(p.categoria)     : '';
  var ds = p && p.descricao     ? fmt.escape(p.descricao)     : '';
  var cu = p ? p.preco_custo        : '0';
  var vd = p ? p.preco_venda        : '';
  var qt = p ? p.quantidade_estoque : '0';
  var mn = p ? p.estoque_minimo     : '5';
  var fo = p && p.fornecedor ? fmt.escape(p.fornecedor) : '';

  return '<div class="campo"><label>Nome do Produto *</label><input type="text" id="p-nome" value="' + n + '" /></div>' +
    '<div class="campo-grupo">' +
      '<div class="campo"><label>Código de Barras</label><input type="text" id="p-codigo" value="' + cb + '" /></div>' +
      '<div class="campo"><label>Categoria</label><input type="text" id="p-cat" value="' + ct + '" placeholder="Ex: Papelaria" /></div>' +
    '</div>' +
    '<div class="campo"><label>Descrição</label><input type="text" id="p-desc" value="' + ds + '" /></div>' +
    '<div class="campo-grupo">' +
      '<div class="campo"><label>Preço de Custo</label><input type="number" id="p-custo" min="0" step="0.01" value="' + cu + '" /></div>' +
      '<div class="campo"><label>Preço de Venda *</label><input type="number" id="p-venda" min="0" step="0.01" value="' + vd + '" /></div>' +
    '</div>' +
    '<div class="campo-grupo">' +
      '<div class="campo"><label>Qtd. Estoque</label><input type="number" id="p-estoque" min="0" value="' + qt + '" /></div>' +
      '<div class="campo"><label>Estoque Mínimo</label><input type="number" id="p-minimo" min="0" value="' + mn + '" /></div>' +
    '</div>' +
    '<div class="campo"><label>Fornecedor</label><input type="text" id="p-fornecedor" value="' + fo + '" /></div>' +
    '<div id="prod-erro" class="alerta alerta--erro" style="display:none"></div>' +
    '<div class="modal-acoes">' +
      '<button class="btn btn--secundario" onclick="fecharModal()">Cancelar</button>' +
      '<button class="btn btn--primario" id="btn-salvar-prod">Salvar</button>' +
    '</div>';
}

document.getElementById('btn-novo-produto').addEventListener('click', function() {
  abrirModal('Novo Produto', htmlFormProduto(null));
  document.getElementById('btn-salvar-prod').addEventListener('click', function() { salvarProduto(null); });
});

async function editarProduto(id) {
  try {
    var p = await api('GET', '/produtos/' + id);
    if (!p) return;
    abrirModal('Editar Produto', htmlFormProduto(p));
    document.getElementById('btn-salvar-prod').addEventListener('click', function() { salvarProduto(id); });
  } catch (err) {
    toast(err.message, 'erro');
  }
}

async function salvarProduto(id) {
  var nome    = document.getElementById('p-nome').value.trim();
  var venda   = document.getElementById('p-venda').value;
  var erroEl  = document.getElementById('prod-erro');
  erroEl.style.display = 'none';

  if (!nome || !venda) {
    erroEl.textContent   = 'Nome e preço de venda são obrigatórios.';
    erroEl.style.display = 'block';
    return;
  }

  var corpo = {
    nome_produto      : nome,
    codigo_barras     : document.getElementById('p-codigo').value.trim()    || null,
    categoria         : document.getElementById('p-cat').value.trim()       || null,
    descricao         : document.getElementById('p-desc').value.trim()      || null,
    preco_custo       : parseFloat(document.getElementById('p-custo').value)   || 0,
    preco_venda       : parseFloat(venda),
    quantidade_estoque: parseInt(document.getElementById('p-estoque').value) || 0,
    estoque_minimo    : parseInt(document.getElementById('p-minimo').value)  || 5,
    fornecedor        : document.getElementById('p-fornecedor').value.trim() || null,
  };

  try {
    if (id) {
      await api('PUT',  '/produtos/' + id, corpo);
    } else {
      await api('POST', '/produtos', corpo);
    }
    fecharModal();
    toast(id ? 'Produto atualizado!' : 'Produto cadastrado!');
    buscarProdutos();
  } catch (err) {
    erroEl.textContent   = err.message;
    erroEl.style.display = 'block';
  }
}

async function excluirProduto(id) {
  if (!confirm('Remover este produto?')) return;
  try {
    await api('DELETE', '/produtos/' + id);
    toast('Produto removido.');
    buscarProdutos();
  } catch (err) {
    toast(err.message, 'erro');
  }
}
