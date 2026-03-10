const URL_GOOGLE_SHEET = "https://script.google.com/macros/s/AKfycbyrhYifVD4M4xTub5U7NC3QpxmsCN3TOVPpKVDOi5LUAuTAyjj25AVIE9q5wQX6r8Dn/exec";

// Máscaras de Entrada
const mascaraCPF = (v) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const mascaraTel = (v) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
const mascaraMoeda = (v) => {
    let n = v.replace(/\D/g, "");
    n = (n/100).toFixed(2).replace(".", ",");
    return "R$ " + n.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
};

document.getElementById('cpf').oninput = (e) => e.target.value = mascaraCPF(e.target.value);
document.getElementById('telefone').oninput = (e) => e.target.value = mascaraTel(e.target.value);
document.getElementById('salario').oninput = (e) => e.target.value = mascaraMoeda(e.target.value);

// Enviar Dados
document.getElementById('formFuncionario').onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-save');
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        await fetch(URL_GOOGLE_SHEET, { method: 'POST', body: new URLSearchParams(new FormData(this)) });
        alert("Salvo com sucesso!");
        this.reset();
    } catch { alert("Erro ao salvar."); }
    finally { btn.innerText = "Salvar"; btn.disabled = false; }
};

// Consultar
async function buscarFuncionarios() {
    const termo = document.getElementById('inputBusca').value.toLowerCase();
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = "Processando...";

    const res = await fetch(`${URL_GOOGLE_SHEET}?action=read`);
    const dados = await res.json();
    
    corpo.innerHTML = "";
    dados.filter(f => f.nome.toLowerCase().includes(termo) || f.cpf.includes(termo)).forEach(f => {
        corpo.innerHTML += `<tr>
            <td>${f.nome}</td>
            <td class="hide-mobile">${f.cargo}</td>
            <td>
                <button onclick='carregarFicha(${JSON.stringify(f)})' class="btn-print" style="padding:5px 10px; font-size:0.8rem">Ficha</button>
                <button onclick="abrirExcluir('${f.cpf}')" class="btn-exit" style="background:red; padding:5px 10px; font-size:0.8rem">X</button>
            </td>
        </tr>`;
    });
}

function carregarFicha(f) {
    Object.keys(f).forEach(key => {
        const el = document.getElementsByName(key)[0];
        if(el) el.value = f[key];
    });
}

// Excluir com Senha
let cpfPendente = null;
function abrirExcluir(cpf) { cpfPendente = cpf; document.getElementById('loginModal').style.display = 'flex'; }
function fecharLogin() { document.getElementById('loginModal').style.display = 'none'; }

async function confirmarExclusao() {
    const auth = document.getElementById('adminKey').value;
    const res = await fetch(`${URL_GOOGLE_SHEET}?action=delete&cpf=${cpfPendente}&auth=${auth}`, { method: 'POST' });
    const texto = await res.text();
    
    if(texto.includes("Sucesso")) {
        alert("Removido!");
        fecharLogin();
        buscarFuncionarios();
    } else { alert("Senha Incorreta!"); }
}

// Exportar PDF
function exportarPDF() {
    const element = document.getElementById('areaFicha');
    const opt = { margin: 10, filename: 'ficha_colaborador.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } };
    html2pdf().set(opt).from(element).save();
}

function sair() { if(confirm("Deseja sair?")) window.location.href = "about:blank"; }
