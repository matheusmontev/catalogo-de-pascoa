let carrinho = [];

// Seleção de elementos
const cartCount = document.getElementById("cartCount");
const carrinhoVazio = document.getElementById("carrinhoVazio");
const carrinhoItensContainer = document.getElementById("carrinhoItens");
const totalCarrinhoContainer = document.getElementById("totalCarrinhoContainer");
const totalCarrinho = document.getElementById("totalCarrinho");
const btnEnviarPedido = document.getElementById("btnEnviarPedido");

let offcanvasInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // Inicializa o OffCanvas nativo do Bootstrap p/ controle manual via JS
    const offcanvasCarrinhoEl = document.getElementById('offcanvasCarrinho');
    offcanvasInstance = new bootstrap.Offcanvas(offcanvasCarrinhoEl);
});

window.abrirCarrinho = () => {
    renderizarCarrinho();
    offcanvasInstance.show();
};

window.adicionarAoCarrinho = (produto, qtd) => {
    // Procura no array se item já existe para somar, se não, faz um push
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
    renderizarCarrinho(); // Atualiza a renderização já que o offcanvas está aberto
};

function atualizarBadgeCart() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    cartCount.textContent = totalItens;
}

function renderizarCarrinho() {
    carrinhoItensContainer.innerHTML = "";
    
    if (carrinho.length === 0) {
        // UI Carrinho Vazio
        carrinhoVazio.classList.remove("d-none");
        totalCarrinhoContainer.classList.add("d-none");
        totalCarrinhoContainer.classList.remove("d-flex");
        btnEnviarPedido.classList.add("d-none");
    } else {
        // UI Carrinho Ocupado
        carrinhoVazio.classList.add("d-none");
        totalCarrinhoContainer.classList.remove("d-none");
        totalCarrinhoContainer.classList.add("d-flex");
        btnEnviarPedido.classList.remove("d-none");
        
        let valorTotal = 0;

        carrinho.forEach(item => {
            const subtotal = item.quantidade * item.preco;
            valorTotal += subtotal;

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

// Botão final placeholder
window.enviarPedido = () => {
    if (carrinho.length === 0) return;

    alert("Pronto! Na próxima etapa criaremos a comunicação com a API do CallMeBot para enviar o pedido.");
    offcanvasInstance.hide();
};
