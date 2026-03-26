import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let carrinho = [];

// Seleção de elementos
const cartCount = document.getElementById("cartCount");
const carrinhoVazio = document.getElementById("carrinhoVazio");
const carrinhoItensContainer = document.getElementById("carrinhoItens");
const totalCarrinhoContainer = document.getElementById("totalCarrinhoContainer");
const totalCarrinho = document.getElementById("totalCarrinho");
const btnEnviarPedido = document.getElementById("btnEnviarPedido");

let offcanvasInstance = null;
let modalFinalizarInstance = null;
let toastInstance = null;

// Elementos Finalizar Pedido
const formFinalizar = document.getElementById("formFinalizar");
const clienteNome = document.getElementById("clienteNome");
const clienteWhatsApp = document.getElementById("clienteWhatsApp");
const resumoPedidoModal = document.getElementById("resumoPedidoModal");
const totalFinalizarModal = document.getElementById("totalFinalizarModal");
const btnConfirmarPedido = document.getElementById("btnConfirmarPedido");
const loadingFinalizar = document.getElementById("loadingFinalizar");

document.addEventListener("DOMContentLoaded", () => {
    // Inicialização do Bootstrap
    const offcanvasCarrinhoEl = document.getElementById('offcanvasCarrinho');
    if (offcanvasCarrinhoEl) offcanvasInstance = new bootstrap.Offcanvas(offcanvasCarrinhoEl);
    
    const modalFinalizarEl = document.getElementById('modalFinalizar');
    if (modalFinalizarEl) modalFinalizarInstance = new bootstrap.Modal(modalFinalizarEl);
    
    const toastSucessoEl = document.getElementById('toastSucesso');
    if (toastSucessoEl) toastInstance = new bootstrap.Toast(toastSucessoEl);

    // Máscara (00) 00000-0000 simples no WhatsApp
    if (clienteWhatsApp) {
        clienteWhatsApp.addEventListener("input", function (e) {
            let val = e.target.value.replace(/\D/g, "");
            let formatted = val;
            if (val.length > 2) {
                formatted = "(" + val.substring(0, 2) + ") " + val.substring(2);
            }
            if (val.length > 7) {
                formatted = "(" + val.substring(0, 2) + ") " + val.substring(2, 7) + "-" + val.substring(7, 11);
            }
            e.target.value = formatted;
        });
    }
});

window.abrirCarrinho = () => {
    renderizarCarrinho();
    offcanvasInstance.show();
};

window.adicionarAoCarrinho = (produto, qtd) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade += qtd;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: parseFloat(produto.preco) || 0,
            foto_url: produto.foto_url,
            quantidade: qtd
        });
    }
    atualizarBadgeCart();
};

window.removerItemCarrinho = (produtoId) => {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarBadgeCart();
    renderizarCarrinho();
};

function atualizarBadgeCart() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    cartCount.textContent = totalItens;
}

function calcularTotal() {
    return carrinho.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
}

function renderizarCarrinho() {
    carrinhoItensContainer.innerHTML = "";
    
    if (carrinho.length === 0) {
        carrinhoVazio.classList.remove("d-none");
        totalCarrinhoContainer.classList.add("d-none");
        totalCarrinhoContainer.classList.remove("d-flex");
        btnEnviarPedido.classList.add("d-none");
    } else {
        carrinhoVazio.classList.add("d-none");
        totalCarrinhoContainer.classList.remove("d-none");
        totalCarrinhoContainer.classList.add("d-flex");
        btnEnviarPedido.classList.remove("d-none");
        
        let valorTotal = calcularTotal();

        carrinho.forEach(item => {
            const subtotal = item.quantidade * item.preco;
            const div = document.createElement("div");
            div.className = "d-flex align-items-center border-bottom pb-3 mb-3";
            
            const precoFormat = `R$ ${item.preco.toFixed(2).replace('.', ',')}`;
            const subtotalFormat = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
            const imgUrl = item.foto_url || "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=50&h=50";

            div.innerHTML = `
                <img src="${imgUrl}" alt="${item.nome}" class="cart-item-img me-3 shadow-sm">
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold text-dark">${item.nome}</h6>
                    <small class="text-muted d-block">${item.quantidade}x ${precoFormat}</small>
                    <span class="text-pink fw-bold mt-1 d-block">${subtotalFormat}</span>
                </div>
                <button class="btn btn-light rounded-circle text-danger border p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" onclick="removerItemCarrinho('${item.id}')" aria-label="Remover item">
                    <i class="bi bi-trash-fill"></i>
                </button>
            `;
            carrinhoItensContainer.appendChild(div);
        });

        totalCarrinho.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    }
}

// Abre o Modal para pedir informações de Nome e WhatsApp
window.enviarPedido = () => {
    if (carrinho.length === 0) return;
    
    offcanvasInstance.hide();
    
    // Resumo UI
    let resumoHtml = carrinho.map(item => `${item.quantidade}x ${item.nome}`).join('<br>');
    resumoPedidoModal.innerHTML = resumoHtml;
    const valorTotal = calcularTotal();
    totalFinalizarModal.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    
    modalFinalizarInstance.show();
};

// Confirmar Formulário
window.confirmarEnvioPedido = async () => {
    if (!formFinalizar.checkValidity()) {
        formFinalizar.reportValidity();
        return;
    }
    
    const nome = clienteNome.value.trim();
    const whatsapp = clienteWhatsApp.value.trim();
    const valorTotal = calcularTotal();

    const pedido = {
        cliente_nome: nome,
        cliente_whatsapp: whatsapp,
        itens: carrinho.map(item => ({
            id: item.id,
            nome: item.nome,
            preco: item.preco,
            quantidade: item.quantidade
        })),
        total: valorTotal,
        status: "novo"
    };

    // UI Feedback Executando
    btnConfirmarPedido.classList.add("d-none");
    loadingFinalizar.classList.remove("d-none");
    
    try {
        // Usa timestamp ofcial do Google Firestore
        pedido.criado_em = serverTimestamp();
        
        // Salvar pedido Firestore
        await addDoc(collection(db, "pedidos"), pedido);
        
        // Oculta modal e exibe Toast de Sucesso
        modalFinalizarInstance.hide();
        toastInstance.show();
        
        // Ajusta timestamp apenas para debug log do notificarEmily
        const pedidoNotificacao = { ...pedido, criado_em: new Date().toISOString() };
        
        // Disparar Notificação Simulando a Function
        notificarEmily(pedidoNotificacao);
        
        // Limpeza (Reset do Carrinho)
        carrinho = [];
        atualizarBadgeCart();
        formFinalizar.reset();
        
    } catch (error) {
        console.error("Erro ao salvar pedido: ", error);
        alert("Ocorreu um erro ao enviar o pedido. Tente novamente.");
    } finally {
        btnConfirmarPedido.classList.remove("d-none");
        loadingFinalizar.classList.add("d-none");
    }
};

// Disparo Real HTTP (Vercel Node.js Serverless Function)
async function notificarEmily(pedido) {
  try {
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    const snap = await getDoc(doc(db, "configuracoes", "geral"));
    if (!snap.exists()) return;

    const config = snap.data();
    const whatsapp = config.whatsapp_emily;
    const apikey = config.callmebot_apikey;

    if (!whatsapp || !apikey) {
      console.warn("WhatsApp ou apikey não configurados.");
      return;
    }

    await fetch('/api/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido, whatsapp, apikey })
    });
  } catch (err) {
    console.error("Erro ao notificar Emily:", err);
  }
}
