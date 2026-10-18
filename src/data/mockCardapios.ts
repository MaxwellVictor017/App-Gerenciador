// ==============================================================================
// BASE DE DADOS CENTRALIZADA DE MODELOS DE RESTAURANTES (DEV HUB MOCK STORE)
// Modelos completos de nichos gastronômicos com identidade visual e categorias
// ==============================================================================

export interface CategoriaMock {
  id: string;
  nome: string;
  ordem?: number;
}

export interface ProdutoMock {
  id: string;
  nome: string;
  descricao?: string | null;
  precoBase: number;
  imagemUrl?: string | null;
  categoria: CategoriaMock;
}

export interface RestauranteMock {
  id: string;
  nome: string;
  slug: string;
  nicho: 'pizzaria' | 'hamburgueria' | 'restaurante' | 'bar' | 'oriental' | 'cafeteria';
  categoriaTag: string;
  icone: string;
  corPrimaria: string;
  logoUrl?: string | null;
  descricao?: string;
  horarioFuncionamento?: string;
  bannerGradient: string;
  tags: string[];
}

export interface CardapioCompletoMock {
  sucesso: boolean;
  restaurante: RestauranteMock;
  total: number;
  produtos: ProdutoMock[];
}

export const RESTAURANTES_CATALOGO: Record<string, CardapioCompletoMock> = {
  // ----------------------------------------------------------------------------
  // 1. PIZZARIA ARTESANAL (MODELO ORIGINAL TOTALMENTE PRESERVADO)
  // ----------------------------------------------------------------------------
  'pizzaria-bella': {
    sucesso: true,
    restaurante: {
      id: 'd9b1a78e-0192-4f33-8a9d-b8d96c429012',
      nome: 'Pizzaria Bella Napolitana',
      slug: 'pizzaria-bella',
      nicho: 'pizzaria',
      categoriaTag: 'Pizzaria Artesanal',
      icone: '🍕',
      corPrimaria: '#E11D48', // Carmim / Rose vibrante
      bannerGradient: 'from-rose-600 via-rose-700 to-rose-900',
      tags: ['Massas', 'Forno a Lenha', 'Vinhos', 'Farinha Italiana'],
      logoUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=160&auto=format&fit=crop&q=80',
      descricao: 'Autênticas pizzas artesanais fermentadas lentamente por 48 horas no forno a lenha.',
      horarioFuncionamento: 'Ter - Dom • 18:30 às 23:30',
    },
    total: 6,
    produtos: [
      {
        id: 'p1',
        nome: 'Bruschetta Tradizionale',
        descricao: 'Pão italiano rústico tostado na lenha com tomates concassé, manjericão e azeite extravirgem.',
        precoBase: 28.5,
        imagemUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'c1', nome: 'Entradas', ordem: 1 },
      },
      {
        id: 'p2',
        nome: 'Burrata ao Pesto Cremoso',
        descricao: 'Burrata fresca sobre cama de rúcula fresca, tomatinhos confitados e pesto genovês.',
        precoBase: 44.0,
        imagemUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69107953?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'c1', nome: 'Entradas', ordem: 1 },
      },
      {
        id: 'p3',
        nome: 'Pizza Margherita D.O.P.',
        descricao: 'Molho San Marzano, mozzarella de búfala artesanal fresca e folhas de manjericão roxo.',
        precoBase: 58.9,
        imagemUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'c2', nome: 'Pizzas', ordem: 2 },
      },
      {
        id: 'p4',
        nome: 'Pizza Diavola Piccante',
        descricao: 'Molho de tomate especial, salame italiano curado levemente apimentado e azeitonas pretas.',
        precoBase: 64.0,
        imagemUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'c2', nome: 'Pizzas', ordem: 2 },
      },
      {
        id: 'p5',
        nome: 'Soda Italiana de Maçã Verde',
        descricao: 'Xarope artesanal francês Monin, água com gás gaseificada na hora e fatias de maçã fresca.',
        precoBase: 16.0,
        imagemUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'c3', nome: 'Bebidas', ordem: 3 },
      },
      {
        id: 'p6',
        nome: 'Vinho Chianti Clássico (Taça)',
        descricao: 'Tinto toscano encorpado com notas de cereja madura, ideal para harmonizar com massas e pizzas.',
        precoBase: 32.0,
        imagemUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'c3', nome: 'Bebidas', ordem: 3 },
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // 2. HAMBURGUERIA ARTESANAL & SMASH BURGER
  // ----------------------------------------------------------------------------
  'burger-craft': {
    sucesso: true,
    restaurante: {
      id: 'b7c3d2e1-4567-4a8b-90c1-123456789abc',
      nome: 'Burger Craft & Co.',
      slug: 'burger-craft',
      nicho: 'hamburgueria',
      categoriaTag: 'Hamburgueria & Smash',
      icone: '🍔',
      corPrimaria: '#EA580C', // Laranja artesanal quente
      bannerGradient: 'from-orange-600 via-amber-700 to-amber-900',
      tags: ['Smash Burgers', 'Pão Brioche', 'Batata Rústica', 'Milkshakes'],
      logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&auto=format&fit=crop&q=80',
      descricao: 'Hambúrgueres artesanais na brasa, smash burgers ultracrocantes e batatas com fondue de cheddar.',
      horarioFuncionamento: 'Seg - Dom • 12:00 às 23:30',
    },
    total: 7,
    produtos: [
      {
        id: 'bc-1',
        nome: 'Smash Duplo Cheddar & Bacon',
        descricao: 'Dois smashes 90g com crostinha perfeita, cheddar inglês derretido, bacon em tiras e maionese defumada no brioche.',
        precoBase: 38.9,
        imagemUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-1', nome: 'Smash Burgers', ordem: 1 },
      },
      {
        id: 'bc-2',
        nome: 'Monster Bacon Barbecue Angus',
        descricao: 'Blend de carne angus 180g selado no fogo, queijo gouda cremoso, cebola caramelizada e barbecue artesanal da casa.',
        precoBase: 46.0,
        imagemUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-2', nome: 'Burgers Especiais', ordem: 2 },
      },
      {
        id: 'bc-3',
        nome: 'Truffled Smash Emmental',
        descricao: 'Dois smashes de fraldinha, queijo emmental suíço derretido, maionese trufada e cogumelos frescos salteados.',
        precoBase: 44.5,
        imagemUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-1', nome: 'Smash Burgers', ordem: 1 },
      },
      {
        id: 'bc-4',
        nome: 'Batatas Rústicas com Cheddar & Bacon',
        descricao: 'Batatas rústicas com casca temperadas com páprica doce e alecrim, cobertas com fondue de cheddar e farofa de bacon.',
        precoBase: 26.0,
        imagemUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-3', nome: 'Acompanhamentos', ordem: 3 },
      },
      {
        id: 'bc-5',
        nome: 'Onion Rings Crocantes Panko',
        descricao: 'Anéis de cebola doce empanados em farinha panko artesanal crocante com molho especial ranch.',
        precoBase: 22.0,
        imagemUrl: 'https://images.unsplash.com/photo-1639024471285-0af50758e74a?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-3', nome: 'Acompanhamentos', ordem: 3 },
      },
      {
        id: 'bc-6',
        nome: 'Milkshake de Nutella & Leite Ninho',
        descricao: 'Sorvete de creme batido com farta camada de Nutella italiana, leite Ninho e chantilly de baunilha.',
        precoBase: 24.9,
        imagemUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-4', nome: 'Sobremesas & Shakes', ordem: 4 },
      },
      {
        id: 'bc-7',
        nome: 'Chopp Artesanal IPA (500ml)',
        descricao: 'Cerveja estilo India Pale Ale lupulada na medida, aroma cítrico e amargor marcante.',
        precoBase: 21.0,
        imagemUrl: 'https://images.unsplash.com/photo-1608270199043-4e892c578dfc?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bc-cat-5', nome: 'Bebidas & Chopps', ordem: 5 },
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // 3. RESTAURANTE EXECUTIVO & GRILL GOURMET
  // ----------------------------------------------------------------------------
  'trattoria-grill': {
    sucesso: true,
    restaurante: {
      id: 'c8d4e3f2-5678-4b9c-81d2-234567890def',
      nome: 'Trattoria & Grill Gourmet',
      slug: 'trattoria-grill',
      nicho: 'restaurante',
      categoriaTag: 'Restaurante & Grill',
      icone: '🥩',
      corPrimaria: '#0F766E', // Esmeralda nobre / Teal
      bannerGradient: 'from-teal-700 via-emerald-800 to-slate-950',
      tags: ['Cortes Nobres', 'Parrilla', 'Risotos', 'Carta de Vinhos'],
      logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=160&auto=format&fit=crop&q=80',
      descricao: 'Cortes de carnes nobres grelhados na parrilla, risotos contemporâneos e clássicos da alta gastronomia.',
      horarioFuncionamento: 'Seg - Dom • 11:30 às 15:30 e 19:00 às 23:30',
    },
    total: 6,
    produtos: [
      {
        id: 'tg-1',
        nome: 'Carpaccio de Filet Mignon Clássico',
        descricao: 'Lâminas ultrafinas de filé, alcaparras marinadas, molho mostarda dijon e lascas de parmesão regadas com azeite trufado.',
        precoBase: 48.0,
        imagemUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'tg-cat-1', nome: 'Entradas & Saladas', ordem: 1 },
      },
      {
        id: 'tg-2',
        nome: 'Salada Caesar com Salmão Grelhado',
        descricao: 'Mix de folhas nobres, croutons de brioche, tiras de salmão grelhado, queijo parmesão ralado e molho caesar artesanal.',
        precoBase: 42.0,
        imagemUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'tg-cat-1', nome: 'Entradas & Saladas', ordem: 1 },
      },
      {
        id: 'tg-3',
        nome: 'Bife Ancho Angus Prime (350g)',
        descricao: 'Corte nobre angus com marmoreio excepcional, acompanhado de chimichurri fresco, farofa de ovos e legumes braseados.',
        precoBase: 89.9,
        imagemUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'tg-cat-2', nome: 'Carnes & Grelhados', ordem: 2 },
      },
      {
        id: 'tg-4',
        nome: 'Picanha Nobre Fatiada na Brasa',
        descricao: 'Acompanha arroz biro-biro clássico, mandioca cremosa na manteiga de garrafa e vinagrete de tomatinhos confitados.',
        precoBase: 94.0,
        imagemUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'tg-cat-2', nome: 'Carnes & Grelhados', ordem: 2 },
      },
      {
        id: 'tg-5',
        nome: 'Risoto de Cogumelos Porcini & Trufas',
        descricao: 'Arroz arbóreo italiano cremoso ao vinho branco, cogumelos porcini frescos, parmesão e finalizado com azeite trufado.',
        precoBase: 68.0,
        imagemUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'tg-cat-3', nome: 'Risotos & Massas', ordem: 3 },
      },
      {
        id: 'tg-6',
        nome: 'Petit Gâteau Chocolate Belga 70%',
        descricao: 'Bolo quente de chocolate belga com interior derretido cremoso e sorvete artesanal de baunilha de Madagascar.',
        precoBase: 29.9,
        imagemUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'tg-cat-4', nome: 'Sobremesas', ordem: 4 },
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // 4. BAR, PETISCARIA & CHOPERIA
  // ----------------------------------------------------------------------------
  'boteco-boemia': {
    sucesso: true,
    restaurante: {
      id: 'e9f5a4b3-6789-4c0d-92e3-345678901abc',
      nome: 'Boteco Boemia Carioca',
      slug: 'boteco-boemia',
      nicho: 'bar',
      categoriaTag: 'Bar & Petiscaria',
      icone: '🍺',
      corPrimaria: '#D97706', // Âmbar Chopp / Dourado
      bannerGradient: 'from-amber-600 via-amber-700 to-yellow-950',
      tags: ['Chopp Trincando', 'Petiscos de Boteco', 'Caipirinhas', 'Música ao Vivo'],
      logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=160&auto=format&fit=crop&q=80',
      descricao: 'O autêntico clima de boteco carioca com chopp super gelado, petiscos clássicos e caipirinhas autorais.',
      horarioFuncionamento: 'Qua - Dom • 16:00 às 01:30',
    },
    total: 6,
    produtos: [
      {
        id: 'bb-1',
        nome: 'Pastéis de Costela Desfiada (6 un)',
        descricao: 'Massa crocante e sequinha recheada com costela bovina cozida lentamente na cerveja preta e queijo cremoso.',
        precoBase: 34.9,
        imagemUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bb-cat-1', nome: 'Petiscos & Porções', ordem: 1 },
      },
      {
        id: 'bb-2',
        nome: 'Bolinho de Bacalhau da Taberna (8 un)',
        descricao: 'Receita tradicional portuguesa com bacalhau Gadus Morhua desfiado, batatas selecionadas e azeite extravirgem.',
        precoBase: 39.0,
        imagemUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bb-cat-1', nome: 'Petiscos & Porções', ordem: 1 },
      },
      {
        id: 'bb-3',
        nome: 'Torresmo de Rolo com Geléia de Pimenta',
        descricao: 'Pancetta suína pururucada crocante por fora e macia por dentro, acompanhada de geléia de pimenta dedo-de-moça.',
        precoBase: 45.0,
        imagemUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bb-cat-1', nome: 'Petiscos & Porções', ordem: 1 },
      },
      {
        id: 'bb-4',
        nome: 'Picanha na Chapa com Queijo Coalho',
        descricao: 'Tiras generosas de picanha acebolada na manteiga de garrafa, queijo coalho grelhado e mandioca frita crocante.',
        precoBase: 78.0,
        imagemUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bb-cat-2', nome: 'Chapa Quente', ordem: 2 },
      },
      {
        id: 'bb-5',
        nome: 'Chopp Pilsen Trincando (Caneca 400ml)',
        descricao: 'Chopp pilsen artesanal puro malte tirado na hora em caneca super congelada com colarinho aveludado.',
        precoBase: 12.5,
        imagemUrl: 'https://images.unsplash.com/photo-1538488881522-4321453a99e3?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bb-cat-3', nome: 'Chopps & Cervejas', ordem: 3 },
      },
      {
        id: 'bb-6',
        nome: 'Caipirinha Três Limões & Rapadura',
        descricao: 'Cachaça nobre envelhecida em amburana, limões tahiti, siciliano e cravo macerados com calda de rapadura.',
        precoBase: 26.0,
        imagemUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'bb-cat-4', nome: 'Drinks & Caipirinhas', ordem: 4 },
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // 5. SUSHI BAR & CULINÁRIA JAPONESA
  // ----------------------------------------------------------------------------
  'sushi-zen': {
    sucesso: true,
    restaurante: {
      id: 'f0a6b5c4-7890-4d1e-a3f4-456789012bcd',
      nome: 'Sushi Zen & Asian Fusion',
      slug: 'sushi-zen',
      nicho: 'oriental',
      categoriaTag: 'Sushi Bar & Oriental',
      icone: '🍣',
      corPrimaria: '#DC2626', // Vermelho Coral & Preto Oriental
      bannerGradient: 'from-red-600 via-rose-800 to-zinc-950',
      tags: ['Sushis Nobres', 'Sashimi Fresco', 'Pokes', 'Saquês'],
      logoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=160&auto=format&fit=crop&q=80',
      descricao: 'Sushis contemporâneos, sashimis de peixes nobres frescos, temakis artesanais e pratos quentes asiáticos.',
      horarioFuncionamento: 'Ter - Dom • 18:00 às 23:45',
    },
    total: 6,
    produtos: [
      {
        id: 'sz-1',
        nome: 'Guiozas de Lombo Suíno (5 un)',
        descricao: 'Pasteizinhos orientais cozidos no vapor e selados na frigideira com recheio de lombo, gengibre e molho ponzu.',
        precoBase: 28.0,
        imagemUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'sz-cat-1', nome: 'Entradas & Quentes', ordem: 1 },
      },
      {
        id: 'sz-2',
        nome: 'Hot Roll Philadelphia Crocante (8 un)',
        descricao: 'Sushi empanado frito na farinha panko com salmão fresco, cream cheese, cebolinha picadinha e molho tarê caseiro.',
        precoBase: 36.0,
        imagemUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'sz-cat-2', nome: 'Hot Rolls & Temakis', ordem: 2 },
      },
      {
        id: 'sz-3',
        nome: 'Temaki Salmão Completo em Dobro',
        descricao: 'Alga nori crocante recheada até o final com arroz shari temperado, cubos generosos de salmão fresco e cream cheese.',
        precoBase: 32.5,
        imagemUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'sz-cat-2', nome: 'Hot Rolls & Temakis', ordem: 2 },
      },
      {
        id: 'sz-4',
        nome: 'Combinado Zen Especial (22 Peças)',
        descricao: '6 sashimis salmão fresco, 4 sashimis atum, 4 niguiris trufados maçaricados com flor de sal, 4 uramakis e 4 dyos.',
        precoBase: 89.0,
        imagemUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'sz-cat-3', nome: 'Combinados Premium', ordem: 3 },
      },
      {
        id: 'sz-5',
        nome: 'Poke Tropical de Salmão & Avocado',
        descricao: 'Base de arroz shari, cubos de salmão cru fresco marinados no gergelim, fatias de manga, avocado, sunomono e edamame.',
        precoBase: 46.9,
        imagemUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'sz-cat-4', nome: 'Pokes', ordem: 4 },
      },
      {
        id: 'sz-6',
        nome: 'Saquê Junmai Importado (Garrafa 300ml)',
        descricao: 'Saquê clássico japonês límpido e aromático, leve e refrescante servido quente ou gelado ao gosto do cliente.',
        precoBase: 38.0,
        imagemUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'sz-cat-5', nome: 'Bebidas Orientais', ordem: 5 },
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // 6. CAFETERIA ESPECIAL, BRUNCH & BISTRÔ
  // ----------------------------------------------------------------------------
  'cafe-bistrot': {
    sucesso: true,
    restaurante: {
      id: 'a1b2c3d4-8901-4e2f-b4a5-567890123cde',
      nome: 'Café Bistrot & Bakery',
      slug: 'cafe-bistrot',
      nicho: 'cafeteria',
      categoriaTag: 'Cafeteria & Confeitaria',
      icone: '☕',
      corPrimaria: '#78350F', // Marrom Café Arábica / Caramelo
      bannerGradient: 'from-amber-800 via-yellow-900 to-amber-950',
      tags: ['Cafés Especiais', 'Brunch', 'Croissants', 'Tortas Finas'],
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&auto=format&fit=crop&q=80',
      descricao: 'Grãos de cafés especiais selecionados 100% arábica, croissants de fermentação natural, toasts e confeitaria fina.',
      horarioFuncionamento: 'Seg - Sáb • 08:00 às 19:30',
    },
    total: 6,
    produtos: [
      {
        id: 'cb-1',
        nome: 'Espresso Blend Bourbon Duplo',
        descricao: 'Extração perfeita com crema aveludada, notas sensoriais de chocolate meio amargo, caramelo e baixa acidez.',
        precoBase: 9.5,
        imagemUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'cb-cat-1', nome: 'Cafés Especiais', ordem: 1 },
      },
      {
        id: 'cb-2',
        nome: 'Cappuccino com Borda de Avelã',
        descricao: 'Espresso duplo, leite vaporizado com microespuma sedosa e borda da xícara lambuzada com Nutella e cacau 100%.',
        precoBase: 16.9,
        imagemUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'cb-cat-1', nome: 'Cafés Especiais', ordem: 1 },
      },
      {
        id: 'cb-3',
        nome: 'Iced Vanilla Oat Latte (400ml)',
        descricao: 'Espresso duplo servido com gelo cristalino, xarope orgânico de baunilha de Madagascar e leite de aveia aveludado.',
        precoBase: 18.5,
        imagemUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'cb-cat-1', nome: 'Cafés Especiais', ordem: 1 },
      },
      {
        id: 'cb-4',
        nome: 'Toast Brioche com Avocado & Ovo Pochê',
        descricao: 'Fatia espessa de brioche artesanal na manteiga, guacamole rústica com azeite extravirgem, ovo pochê caipira gema mole e chia.',
        precoBase: 28.0,
        imagemUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'cb-cat-2', nome: 'Brunch & Salgados', ordem: 2 },
      },
      {
        id: 'cb-5',
        nome: 'Croissant Francês de Amêndoas Tostadas',
        descricao: 'Massa folhada de pura manteiga francesa recheada e coberta com frangipane de amêndoas e lâminas tostadas.',
        precoBase: 22.0,
        imagemUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'cb-cat-3', nome: 'Padaria & Confeitaria', ordem: 3 },
      },
      {
        id: 'cb-6',
        nome: 'Cheesecake com Frutas Vermelhas Silvestres',
        descricao: 'Base crocante amanteigada de biscoito, creme sedoso de cream cheese assado e farta calda artesanal de framboesas e mirtilos.',
        precoBase: 24.0,
        imagemUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=80',
        categoria: { id: 'cb-cat-3', nome: 'Padaria & Confeitaria', ordem: 3 },
      },
    ],
  },
};

// Retorna lista com os restaurantes formatados para exibição no Dev Hub
export const LISTA_RESTAURANTES_HUB = Object.values(RESTAURANTES_CATALOGO).map((item) => ({
  ...item.restaurante,
  totalItens: item.total,
  categorias: Array.from(new Set(item.produtos.map((p) => p.categoria.nome))),
  produtosDestaque: item.produtos.slice(0, 3).map((p) => p.nome),
}));
