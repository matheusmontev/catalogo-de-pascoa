import { db } from "./firebase-config.js";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ── GLOBAIS E INTERFACE ──
let produtosCache = [];
let categoriasCache = [];
let produtoAtualModal = null; 

// Elementos da interface
const avisoHeader = document.getElementById("avisoHeader");
const textoAviso = document.getElementById("textoAviso");
const loader = document.getElementById("loader");
const menuContainer = document.getElementById("menuContainer");
const categoriasTab = document.getElementById("categoriasTab");
const produtosGrid = document.getElementById("produtosGrid");

const modalAdicionar = new bootstrap.Modal(document.getElementById('modalAdicionar'));

// ── CARREGAMENTO PRINCIPAL ──
document.addEventListener("DOMContentLoaded", async () => {
    await carregarMenu();
});

async function carregarMenu() {
    try {
        // 1. Carregar Configurações Gerais
        const configRef = doc(db, "configuracoes", "geral");
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists()) {
            const config = configSnap.data();
            if (config.aviso_texto && config.aviso_texto.trim() !== "") {
                textoAviso.textContent = config.aviso_texto;
                avisoHeader.classList.remove("d-none");
            }
            if (config.logo_url && config.logo_url.trim() !== "") {
                const logoEl = document.getElementById("logoCardapio");
                const splashEl = document.getElementById("splashLogo");
                if (logoEl) {
                    logoEl.src = config.logo_url;
                }
                if (splashEl) {
                    splashEl.src = config.logo_url;
                }
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = config.logo_url;
            }

            if (config.loja_aberta === false) {
                document.getElementById("lojaFechadaMsg").classList.remove("d-none");
                loader.classList.add("d-none");
                menuContainer.style.display = "none";
                document.getElementById("fabCart").classList.add("d-none");
                return;
            }
        }

        // 2. Carregar Categorias
        const catQuery = query(collection(db, "categorias"), orderBy("ordem", "asc"));
        const catSnap = await getDocs(catQuery);
        catSnap.forEach(doc => {
            categoriasCache.push({ id: doc.id, ...doc.data() });
        });

        // 3. Carregar Produtos (Somente os ativos)
        const prodQuery = query(collection(db, "produtos"), where("ativo", "==", true));
        const prodSnap = await getDocs(prodQuery);
        prodSnap.forEach(doc => {
            produtosCache.push({ id: doc.id, ...doc.data() });
        });

        // 4. Renderizar interface
        renderizarCardapio();

        // Limpar tela de carregamento (Spinner interno ignorado pela SplashScreen por cima)
        loader.classList.add("d-none");
        menuContainer.style.display = "block";
        
        // Timer da Splash para imersão agradável
        setTimeout(() => {
            const splash = document.getElementById("splashScreen");
            if(splash) {
                splash.style.opacity = "0";
                splash.style.visibility = "hidden";
                setTimeout(() => splash.remove(), 600);
            }
        }, 1200);
    } catch (error) {
        console.error("Erro ao carregar cardápio:", error);
        loader.innerHTML = "<p class='text-danger fw-bold'>Erro de conexão com o painel.</p>";
    }
}

function renderizarCardapio() {
    categoriasTab.innerHTML = "";
    produtosGrid.innerHTML = "";

    // Filtra para exibir apenas categorias que possuem produtos ativos
    const categoriasVisiveis = categoriasCache.filter(cat => 
        produtosCache.some(p => p.categoria_id === cat.id)
    );

    if (categoriasVisiveis.length === 0) {
        produtosGrid.innerHTML = `
            <div class="text-center text-muted mt-5">
                <i class="bi bi-emoji-frown fs-1"></i>
                <p class="mt-3">Nenhum produto disponível no momento.</p>
            </div>
        `;
        return;
    }

    categoriasVisiveis.forEach((cat, index) => {
        // Gerar Pills(Tabs)
        const li = document.createElement("li");
        li.className = "nav-item";
        li.innerHTML = `<a class="nav-link shadow-sm ${index === 0 ? 'active' : ''}" href="#cat-${cat.id}">${cat.nome}</a>`;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-pills .nav-link').forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(`cat-${cat.id}`).scrollIntoView({ behavior: 'smooth' });
        });

        categoriasTab.appendChild(li);

        // Gerar Grid por Categoria
        const secao = document.createElement("div");
        secao.id = `cat-${cat.id}`;
        secao.innerHTML = `<h4 class="category-title">${cat.nome}</h4>`;
        
        const row = document.createElement("div");
        row.className = "row g-3";

        const produtosCategoria = produtosCache.filter(p => p.categoria_id === cat.id);
        
        produtosCategoria.forEach(prod => {
            const col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-4";
            
            const precoFormatado = prod.preco ? `R$ ${parseFloat(prod.preco).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
            // Usa as imagems salvas via Firebase Storage ou um placeholder decorativo
            const imgPlaceholder = "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=300&h=200"; 
            const fotoUrl = prod.foto_url || imgPlaceholder;

            col.innerHTML = `
                <div class="product-card h-100">
                    <img src="${fotoUrl}" alt="${prod.nome}" class="product-img" loading="lazy">
                    <div class="product-info d-flex flex-column h-100">
                        <div class="product-title">${prod.nome}</div>
                        <div class="product-desc flex-grow-1">${prod.descricao || ''}</div>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="text-pink fw-bold fs-5">${precoFormatado}</span>
                            <button class="btn btn-sm btn-pink fw-bold px-3 py-2 rounded-pill" onclick="prepararAdicao('${prod.id}')">Adicionar</button>
                        </div>
                    </div>
                </div>
            `;
            row.appendChild(col);
        });

        secao.appendChild(row);
        produtosGrid.appendChild(secao);
    });
}

// ── LÓGICA DE MODAL (CARRINHO E QTDS) ──
window.prepararAdicao = (produtoId) => {
    const produto = produtosCache.find(p => p.id === produtoId);
    if (!produto) return;
    
    produtoAtualModal = produto;

    document.getElementById("modalAddNome").textContent = produto.nome;
    document.getElementById("modalAddDesc").textContent = produto.descricao || "";
    
    document.getElementById("qtdItem").textContent = "1"; // Reseta
    atualizarSubtotalModal(1);
    
    modalAdicionar.show();
};

window.alterarQtd = (delta) => {
    const qtdEl = document.getElementById("qtdItem");
    let qtd = parseInt(qtdEl.textContent) + delta;
    if (qtd < 1) qtd = 1;
    qtdEl.textContent = qtd;
    atualizarSubtotalModal(qtd);
};

function atualizarSubtotalModal(qtd) {
    if(!produtoAtualModal) return;
    const preco = parseFloat(produtoAtualModal.preco) || 0;
    const precoFormatado = `R$ ${(preco * 1).toFixed(2).replace('.', ',')}`;
    const totalFormatado = `R$ ${(preco * qtd).toFixed(2).replace('.', ',')}`;
    
    document.getElementById("modalAddPreco").textContent = precoFormatado;
    document.getElementById("modalAddSubtotal").textContent = `(${totalFormatado})`;
}

window.confirmarAdicao = () => {
    if(!produtoAtualModal) return;
    const qtd = parseInt(document.getElementById("qtdItem").textContent);
    
    if(window.adicionarAoCarrinho) {
        window.adicionarAoCarrinho(produtoAtualModal, qtd);
    }
    
    modalAdicionar.hide();
};
