import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Cloudinary Vars
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dwxzgwt2h/image/upload";
const UPLOAD_PRESET = "emilly_doces_preset";

// Globais
let categoriasData = [];
let pedidosCacheLoc = [];

let mProduto, mCategoria, mPedido;

document.addEventListener("DOMContentLoaded", () => {
    mProduto = new bootstrap.Modal(document.getElementById("modalProduto"));
    mCategoria = new bootstrap.Modal(document.getElementById("modalCategoria"));
    mPedido = new bootstrap.Modal(document.getElementById("modalVerPedido"));

    // Auth state hook
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById("loginScreen").classList.add("hidden");
            document.getElementById("adminScreen").classList.remove("hidden");
            carregarTudo();
        } else {
            document.getElementById("loginScreen").classList.remove("hidden");
            document.getElementById("adminScreen").classList.add("hidden");
        }
    });

    document.getElementById("produtoArquivo").addEventListener("change", fazerUploadCloudinary);
});

// AUTENTICACAO
document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnLogin");
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    
    btn.disabled = true;
    document.getElementById("loginError").classList.add("hidden");
    
    try {
        await signInWithEmailAndPassword(auth, email, senha);
        console.log("Login completado com sucesso");
    } catch (error) {
        console.error("Erro no login:", error);
        document.getElementById("loginError").textContent = "E-mail ou senha incorretos.";
        document.getElementById("loginError").classList.remove("hidden");
    } finally {
        btn.disabled = false;
    }
});

window.fazerLogout = async () => {
    try { await signOut(auth); } catch(e) { console.error("Erro ao fazer logout:", e); }
};

// INITIAL LOAD
async function carregarTudo() {
    await carregarCategorias();
    await carregarProdutos();
    await carregarPedidos();
    await carregarConfiguracoes();
}

// ----------------------
// CATEGORIAS
// ----------------------
async function carregarCategorias() {
    const lista = document.getElementById("listaCategorias");
    const select = document.getElementById("produtoCategoria");
    
    try {
        const q = query(collection(db, "categorias"), orderBy("ordem", "asc"));
        const snap = await getDocs(q);
        categoriasData = [];
        lista.innerHTML = "";
        select.innerHTML = '<option value="">Selecione...</option>';

        snap.forEach(d => {
            const data = d.data();
            categoriasData.push({ id: d.id, ...data });
            lista.innerHTML += `
                <tr>
                    <td class="fw-bold">${data.nome}</td>
                    <td>${data.ordem}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-secondary" onclick="editarCategoria('${d.id}','${data.nome}',${data.ordem})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirCategoria('${d.id}')">Excluir</button>
                    </td>
                </tr>
            `;
            select.innerHTML += `<option value="${d.id}">${data.nome}</option>`;
        });
        if(categoriasData.length === 0) lista.innerHTML = "<tr><td colspan='3'>Não há dados.</td></tr>";
    } catch(err) { console.error("Erro nav categorias", err); }
}

window.abrirModalCategoria = () => {
    document.getElementById("formCategoria").reset();
    document.getElementById("categoriaId").value = "";
    document.getElementById("modalCategoriaTitle").textContent = "Nova Categoria";
    mCategoria.show();
};
window.editarCategoria = (id, nome, ordem) => {
    document.getElementById("categoriaId").value = id;
    document.getElementById("categoriaNome").value = nome;
    document.getElementById("categoriaOrdem").value = ordem;
    document.getElementById("modalCategoriaTitle").textContent = "Editar Categoria";
    mCategoria.show();
};
window.salvarCategoria = async (e) => {
    e.preventDefault();
    const id = document.getElementById("categoriaId").value;
    const data = {
        nome: document.getElementById("categoriaNome").value.trim(),
        ordem: parseInt(document.getElementById("categoriaOrdem").value) || 1
    };
    try {
        if(id) await updateDoc(doc(db, "categorias", id), data);
        else await addDoc(collection(db, "categorias"), data);
        mCategoria.hide();
        carregarCategorias();
        carregarProdutos();
    } catch(err) { console.error("Erro ao salvar categoria:", err); }
};
window.excluirCategoria = async (id) => {
    if(confirm("Excluir?")) {
        await deleteDoc(doc(db, "categorias", id));
        carregarCategorias();
    }
};

// ----------------------
// PRODUTOS
// ----------------------
async function carregarProdutos() {
    const lista = document.getElementById("listaProdutos");
    try {
        const catMap = categoriasData.reduce((acc, c) => { acc[c.id]=c.nome; return acc; }, {});
        const snap = await getDocs(collection(db, "produtos"));
        lista.innerHTML = "";
        
        let arr = [];
        snap.forEach(d => arr.push({id: d.id, ...d.data()}));
        
        arr.forEach(data => {
            const urlFoto = data.foto_url || "https://via.placeholder.com/50";
            const precoFmt = `R$ ${(data.preco||0).toFixed(2).replace('.', ',')}`;
            const catNm = catMap[data.categoria_id] || "Sem Categoria";
            const objSafe = JSON.stringify(data).replace(/'/g, "&apos;").replace(/"/g, '&quot;');
            
            lista.innerHTML += `
                <tr>
                    <td><img src="${urlFoto}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td>
                    <td class="fw-bold">${data.nome}</td>
                    <td><span class="badge border text-dark">${catNm}</span></td>
                    <td class="text-pink fw-bold">${precoFmt}</td>
                    <td>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" ${data.ativo?'checked':''} onchange="toggleProdutoAtivo('${data.id}', this.checked)">
                        </div>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-secondary" onclick="editarProduto('${objSafe}')">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto('${data.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
        if(arr.length === 0) lista.innerHTML = "<tr><td colspan='6'>Sem dados.</td></tr>";
    } catch(err) { console.error("Erro ao carregar produtos:", err); }
}

window.toggleProdutoAtivo = async (id, status) => { await updateDoc(doc(db, "produtos", id), { ativo: status }); };

window.abrirModalProduto = () => {
    document.getElementById("formProduto").reset();
    document.getElementById("produtoId").value = "";
    document.getElementById("produtoFotoUrl").value = "";
    document.getElementById("previewProduto").classList.add("hidden");
    document.getElementById("modalProdutoTitle").textContent = "Criar Produto";
    mProduto.show();
};
window.editarProduto = (str) => {
    const p = JSON.parse(str.replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
    document.getElementById("produtoId").value = p.id;
    document.getElementById("produtoNome").value = p.nome;
    document.getElementById("produtoCategoria").value = p.categoria_id;
    document.getElementById("produtoPreco").value = p.preco;
    document.getElementById("produtoDescricao").value = p.descricao || "";
    document.getElementById("produtoFotoUrl").value = p.foto_url || "";
    document.getElementById("produtoAtivo").checked = p.ativo;
    
    if(p.foto_url) {
        let prev = document.getElementById("previewProduto");
        prev.src = p.foto_url;
        prev.classList.remove("hidden");
    }
    document.getElementById("modalProdutoTitle").textContent = "Editar Produto";
    mProduto.show();
};
window.salvarProduto = async (e) => {
    e.preventDefault();
    const id = document.getElementById("produtoId").value;
    const data = {
        nome: document.getElementById("produtoNome").value.trim(),
        categoria_id: document.getElementById("produtoCategoria").value,
        preco: parseFloat(document.getElementById("produtoPreco").value),
        descricao: document.getElementById("produtoDescricao").value.trim(),
        foto_url: document.getElementById("produtoFotoUrl").value,
        ativo: document.getElementById("produtoAtivo").checked
    };
    try {
        if(id) await updateDoc(doc(db, "produtos", id), data);
        else await addDoc(collection(db, "produtos"), data);
        mProduto.hide();
        carregarProdutos();
    } catch(err) { 
        console.error("Erro ao salvar produto:", err);
        alert("Erro ao salvar"); 
    }
};
window.excluirProduto = async (id) => {
    if(confirm("Excluir produto definitivamente?")) {
        await deleteDoc(doc(db, "produtos", id));
        carregarProdutos();
    }
};

// ----------------------
// UPLOAD CLOUDINARY
// ----------------------
async function fazerUploadCloudinary(e) {
    const file = e.target.files[0];
    if(!file) return;

    document.getElementById("uploadFeedback").classList.remove("hidden");
    document.getElementById("btnSalvarProduto").disabled = true;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    try {
        const res = await fetch(CLOUDINARY_URL, { method: "POST", body: fd });
        const data = await res.json();
        if(data.secure_url) {
            console.log("Upload no Cloudinary feito com sucesso");
            document.getElementById("produtoFotoUrl").value = data.secure_url;
            let p = document.getElementById("previewProduto");
            p.src = data.secure_url;
            p.classList.remove("hidden");
        } else {
            console.error(data);
            alert("Erro do Cloudinary - Preset: " + UPLOAD_PRESET);
        }
    } catch(e) {
        console.error("Erro no upload do cloudinary:", e);
        alert("Erro HTTP no upload.");
    } finally {
        document.getElementById("uploadFeedback").classList.add("hidden");
        document.getElementById("btnSalvarProduto").disabled = false;
    }
}

// ----------------------
// PEDIDOS
// ----------------------
async function carregarPedidos() {
    const lista = document.getElementById("listaPedidos");
    try {
        const q = query(collection(db, "pedidos"), orderBy("criado_em", "desc"));
        const snap = await getDocs(q);
        pedidosCacheLoc = [];
        lista.innerHTML = "";
        
        snap.forEach(d => {
            const data = d.data();
            pedidosCacheLoc.push({ id: d.id, ...data });
            
            let dataFmt = "S/D";
            if(data.criado_em && data.criado_em.toDate) {
                const dt = data.criado_em.toDate();
                dataFmt = dt.toLocaleDateString("pt-BR") + " " + dt.getHours().toString().padStart(2,'0') + ":" + dt.getMinutes().toString().padStart(2,'0');
            }
            
            const badge = data.status === 'concluido' ? 'success' : 'warning text-dark';
            const bTxt = data.status === 'concluido' ? 'Concluído' : 'Aberto';
            const btnAc = data.status === 'concluido' 
                ? '<button disabled class="btn btn-sm btn-secondary">Fin.</button>'
                : `<button class="btn btn-sm btn-success" onclick="marcarConcluido('${d.id}')">Concluir</button>`;
                
            lista.innerHTML += `
                <tr>
                    <td class="small">${dataFmt}</td>
                    <td class="fw-bold">${data.cliente_nome}</td>
                    <td>${data.cliente_whatsapp}</td>
                    <td class="text-pink fw-bold">R$ ${(data.total||0).toFixed(2).replace('.',',')}</td>
                    <td><span class="badge bg-${badge}">${bTxt}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-info" onclick="verPedido('${d.id}')">Ver</button>
                        ${btnAc}
                    </td>
                </tr>
            `;
        });
    } catch(err) { console.error("Erro ao carregar pedidos:", err); }
}

window.verPedido = (id) => {
    const p = pedidosCacheLoc.find(x => x.id === id);
    if(!p) return;
    
    let html = `<p><b>Cliente:</b> ${p.cliente_nome}<br><b>WhatsApp:</b> ${p.cliente_whatsapp}</p><hr><ul>`;
    p.itens.forEach(i => {
        let sub = (parseFloat(i.preco||0) * i.quantidade).toFixed(2).replace('.',',');
        html += `<li>${i.quantidade}x ${i.nome} - R$ ${sub}</li>`;
    });
    html += `</ul><hr><h5 class="text-end text-pink fw-bold">Total: R$ ${(p.total||0).toFixed(2).replace('.',',')}</h5>`;
    
    document.getElementById("conteudoDetalhePedido").innerHTML = html;
    mPedido.show();
};
window.marcarConcluido = async (id) => {
    if(confirm("Marcar finalizado?")) {
        await updateDoc(doc(db, "pedidos", id), { status: "concluido" });
        carregarPedidos();
    }
};

// ----------------------
// CONFIGURACOES
// ----------------------
async function carregarConfiguracoes() {
    try {
        const snap = await getDoc(doc(db, "configuracoes", "geral"));
        if(snap.exists()) {
            const data = snap.data();
            document.getElementById("configAviso").value = data.aviso_texto || "";
            document.getElementById("configLogo").value = data.logo_url || "";
            document.getElementById("configWhats").value = data.whatsapp_emily || "";
            document.getElementById("configApikey").value = data.callmebot_apikey || "";
        }
    } catch(err) { console.error("Erro ao carregar configuracoes:", err); }
}

window.salvarConfiguracoes = async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnSalvarConfig");
    btn.disabled = true;
    try {
        await setDoc(doc(db, "configuracoes", "geral"), {
            aviso_texto: document.getElementById("configAviso").value,
            logo_url: document.getElementById("configLogo").value,
            whatsapp_emily: document.getElementById("configWhats").value,
            callmebot_apikey: document.getElementById("configApikey").value
        });
        console.log("Configurações salvas com sucesso");
        alert("Salvo!");
    } catch(err) { console.error("Erro ao salvar configuracoes:", err); }
    btn.disabled = false;
};
