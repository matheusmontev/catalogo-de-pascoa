# 🐰 Emilly Doces Artesanais - Catálogo Digital

![Banner](https://img.shields.io/badge/Status-Desenvolvimento-green?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

Uma plataforma completa de cardápio digital e gestão de pedidos desenvolvida especialmente para a **Emilly Doces Artesanais**. O sistema permite que clientes visualizem produtos, montem carrinhos e enviem pedidos diretamente para o WhatsApp da proprietária, com todo o gerenciamento centralizado em um painel administrativo robusto.

---

## ✨ Funcionalidades

### 🛒 Área do Cliente (Vitrine)
- **Interface Mobile-First**: Design otimizado para navegação intuitiva em smartphones.
- **Categorização Inteligente**: Navegação rápida entre diferentes tipos de doces e ovos de páscoa.
- **Carrinho Dinâmico**: Adição de itens com controle de quantidade e cálculo automático de subtotal.
- **Finalização Simplificada**: Coleta de dados básica (Nome e WhatsApp) para agilizar o atendimento.
- **Status da Loja**: Aviso em tempo real se a loja está aberta ou fechada para pedidos.
- **Notificações em Tempo Real**: Alertas visuais (toasts) de sucesso ao enviar pedidos.

### 🔐 Painel Administrativo
- **Autenticação Segura**: Acesso restrito via Firebase Auth para garantir a segurança dos dados.
- **Gestão de Produtos**: CRUD completo (Criar, Ler, Atualizar, Deletar) com suporte a imagens e descrições.
- **Gestão de Categorias**: Organização flexível da ordem de exibição no cardápio.
- **Controle de Pedidos**: Visualização detalhada de todos os pedidos recebidos, com dados do cliente e lista de itens.
- **Configurações Globais**:
    - Chave mestre para abrir/fechar a loja.
    - Edição de banners de aviso e links de logo.
    - Configuração de integração com **CallMeBot** para notificações instantâneas no WhatsApp da Emilly.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma stack moderna e serverless para garantir alta disponibilidade e baixo custo:

- **Frontend**: HTML5, CSS3 (Vanilla), Bootstrap 5 para layout responsivo e Bootstrap Icons.
- **Backend / Database**: 
    - **Firebase Firestore**: Banco de dados NoSQL em tempo real.
    - **Firebase Authentication**: Gestão de usuários do painel.
    - **Cloudinary API**: (Opcional/Planejado) Para otimização e processamento de imagens de produtos.
- **Integrações**: 
    - **CallMeBot API**: Notificação automática de novos pedidos no WhatsApp.
- **Hospedagem**: Vercel.

---

## 🎨 Design System

O projeto utiliza uma paleta de cores voltada para confeitaria:
- **Rosa Principal**: `#e83e8c` (Destaques e botões)
- **Fundo**: `#f4f6f9` (Leitura limpa)
- **Cartões**: Background branco com sombras suaves para efeito de "elevação".

---

<p align="center">Desenvolvido para a Emilly Doces</p>
