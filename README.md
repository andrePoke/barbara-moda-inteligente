# Barbara Moda Inteligente — E-Commerce Oficial

> **"Seu estilo. Sua essência. Sua melhor versão."**  
> Loja virtual completa, moderna, veloz e de alto padrão desenvolvida especialmente para a marca **Barbara Moda Inteligente**.

---

## 💎 Identidade e Direção de Arte

- **Paleta de Cores:** Off-White (`#FDFBF7`), Bege Nude Editorial (`#F4EFE6`), Preto Intenso (`#121212`), Vinho Imperial (`#581825`) e Ouro Suave (`#C5A880`).
- **Tipografia:** Serifas sofisticadas (*Playfair Display*) combinadas com sem-serifa limpa e geométrica (*Plus Jakarta Sans*).
- **Fotografia e Design:** Fotografias editoriais de alta resolução, microinterações refinadas nos seletores de cor e tamanho, drawer lateral para sacola rápida e layout 100% responsivo mobile-first.

---

## 🚀 Arquitetura e Engenharia de Software

- **Frontend:** React 18 SPA + Vite + Tailwind CSS + Lucide Icons.
- **Backend:** Node.js v24 + Express REST API com suporte nativo a ESM.
- **Banco de Dados:** Engine SQLite nativo (`node:sqlite` DatabaseSync) com persistência em arquivo relacional (`data/barbara_ecommerce.db`), chaves estrangeiras ativas e transações ACID (`BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`).
- **Autenticação & Segurança:** Tokens JWT com hashing criptográfico `bcryptjs`, proteção contra acesso indevido a pedidos alheios e total conformidade com a LGPD (senhas nunca trafegam em claro ou em consultas administrativas).
- **Gestão de Estoque por Variante:** Cada combinação de cor e tamanho (ex: *Vestido Midi / Preto / P*) possui estoque unitário, SKU próprio e auditoria de movimentações (`stock_movements`).

---

## 🛠️ Como Executar a Aplicação

### 1. Pré-requisitos
- Node.js instalado (v20+ ou v24 LTS recomendado).

### 2. Instalação de Dependências
Na pasta do projeto (`barbara-moda-inteligente`):
```bash
npm install
```

### 3. Compilação do Frontend
```bash
npm run build
```

### 4. Iniciar Servidor Completo (API + Loja SPA)
```bash
npm start
```
Acesse no seu navegador: **`http://localhost:5050`**

### 5. Modo de Desenvolvimento com Hot-Reload (Vite + Node)
Em um terminal (Backend API):
```bash
npm run dev:server
```
Em outro terminal (Frontend Vite com HMR na porta 3000):
```bash
npm run dev:client
```

---

## 🔐 Credenciais Padrão do Sistema

### Administrador da Loja (Acesso ao `/admin`):
- **E-mail:** `admin@barbaramoda.com.br`
- **Senha:** `admin123`

### Cliente para Testes:
- **E-mail:** `cliente@exemplo.com.br`
- **Senha:** `cliente123`

---

## 📦 Estrutura do Projeto

```
barbara-moda-inteligente/
├── data/                      # Banco de dados SQLite persistente
│   └── barbara_ecommerce.db
├── dist/                      # Build otimizado do React SPA para produção
├── server/                    # Backend API Express & DB Engine
│   ├── routes/
│   │   ├── adminRoutes.js     # Dashboard com métricas reais, CRUD produtos/pedidos/cupons
│   │   ├── authRoutes.js      # Cadastro, login JWT, alteração de senha, endereços
│   │   ├── cartRoutes.js      # Validação em tempo real de estoque e preços
│   │   ├── couponRoutes.js    # Validação server-side de cupons e regras de compra mínima
│   │   ├── orderRoutes.js     # Checkout atômico transacional e rastreamento
│   │   ├── productRoutes.js   # Catálogo com filtros de cor, tamanho, preço e busca
│   │   └── settingsRoutes.js  # Configurações dinâmicas (WhatsApp, Instagram, Mapa, Avaliações)
│   ├── auth.js                # Middlewares requireAuth, requireAdmin e gerador JWT
│   ├── db.js                  # DDL das 11 tabelas, migrações e seed realista inicial
│   ├── index.js               # Entrypoint do servidor Express
│   └── tests/
│       └── acceptance_test.js # Bateria automatizada de 23 testes de aceitação
├── src/                       # Frontend React
│   ├── components/            # Header, Drawer de sacola, ProductCard, Modais, Footer, WhatsApp
│   ├── context/               # AuthContext, CartContext, WishlistContext, SettingsContext
│   ├── pages/                 # Home, Catálogo, Produto, Checkout, Confirmação, Conta, Admin
│   ├── App.jsx                # Roteador de alta performance
│   ├── index.css              # Estilos e Tailwind CSS
│   └── main.jsx
├── uploads/                   # Armazenamento de fotos de produtos enviadas no admin
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🎯 Cobertura dos 15 Critérios de Aceitação

1. ✅ **Cadastro Completo:** O administrador cadastra produtos com fotos múltiplas, cores e tamanhos.
2. ✅ **Estoque Independente:** Cada combinação de cor e tamanho possui estoque e SKU exclusivos.
3. ✅ **Seleção Visual:** O cliente escolhe amostras de cores, visualiza tamanhos disponíveis e fotos correspondentes.
4. ✅ **Bloqueio de Esgotados:** Impossível adicionar ou finalizar combinações sem estoque.
5. ✅ **Autenticação Real:** Cadastro, login com JWT, recuperação de senha e atualização de perfil.
6. ✅ **Sacola Persistente:** Preservada no navegador e recalculada no servidor.
7. ✅ **Validação Rigorosa:** Preços e disponibilidades validados no backend com lock transacional.
8. ✅ **Pedido e Snapshot:** Gravação de snapshot comercial imutável de itens, cores, tamanhos e valores.
9. ✅ **Pagamento Legítimo:** Pix com código Copia e Cola/QR Code real, cartão e modo assistido WhatsApp.
10. ✅ **Gestão Operacional:** Painel admin com alteração de status (preparando, enviado, entregue) e código de rastreio.
11. ✅ **Privacidade & LGPD:** Proteção de acesso entre clientes; senhas protegidas com bcrypt.
12. ✅ **Mobile-First:** Design fluido em celulares, tablets e telas widescreen.
13. ✅ **Canais Oficiais:** WhatsApp contextualizado por produto/pedido, Instagram oficial e mapa Google Maps.
14. ✅ **Dashboard Real:** Indicadores de vendas, ticket médio e alertas de estoque baixo calculados diretamente do banco SQLite.
15. ✅ **Transparência:** Políticas de troca, devolução, privacidade e prazos de entrega detalhados.
