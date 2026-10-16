import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ==============================================================================
// TIPAGEM (TYPESCRIPT)
// ==============================================================================

export interface Adicional {
  nome: string;
  preco: number;
}

export interface CartItem {
  id: string;
  produto_id: string;
  nome: string;
  preco_base: number;
  quantidade: number;
  adicionais?: Adicional[];
}

export type AddItemInput = Omit<CartItem, 'id' | 'quantidade'> & {
  quantidade?: number;
};

export interface CartStore {
  // Estado
  items: CartItem[];

  // Ações (Actions)
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;

  // Getters / Calculadoras
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// ==============================================================================
// FUNÇÕES AUXILIARES INTERNAS
// ==============================================================================

/**
 * Gera um ID único e seguro para a linha do item no carrinho.
 * Suporta crypto.randomUUID() nativo com fallback temporal robusto.
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Compara dois conjuntos de adicionais para determinar equivalência exata,
 * independentemente da ordem em que foram selecionados.
 */
const areAdicionaisEqual = (
  a?: Adicional[],
  b?: Adicional[]
): boolean => {
  const listaA = a || [];
  const listaB = b || [];

  if (listaA.length !== listaB.length) return false;
  if (listaA.length === 0 && listaB.length === 0) return true;

  // Ordena por nome para comparação consistente
  const ordenadosA = [...listaA].sort((x, y) => x.nome.localeCompare(y.nome));
  const ordenadosB = [...listaB].sort((x, y) => x.nome.localeCompare(y.nome));

  return ordenadosA.every(
    (itemA, index) =>
      itemA.nome === ordenadosB[index].nome && itemA.preco === ordenadosB[index].preco
  );
};

// ==============================================================================
// ZUSTAND STORE COM PERSISTÊNCIA (LOCALSTORAGE)
// ==============================================================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      /**
       * Adiciona um item ao carrinho.
       * Se o produto possuir os mesmos adicionais, apenas incrementa a quantidade.
       * Se houver qualquer divergência nos adicionais, cria uma nova linha com ID exclusivo.
       */
      addItem: (itemInput: AddItemInput) => {
        const { items } = get();
        const quantidadeAdicionar = itemInput.quantidade && itemInput.quantidade > 0
          ? itemInput.quantidade
          : 1;

        // Localiza se já existe o exato mesmo produto com a mesma customização de adicionais
        const existingItemIndex = items.findIndex(
          (item) =>
            item.produto_id === itemInput.produto_id &&
            areAdicionaisEqual(item.adicionais, itemInput.adicionais)
        );

        if (existingItemIndex > -1) {
          // Incrementa a quantidade da linha existente
          const updatedItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantidade: item.quantidade + quantidadeAdicionar }
              : item
          );

          set({ items: updatedItems });
        } else {
          // Cria uma nova linha no carrinho com identificador único
          const newItem: CartItem = {
            id: generateId(),
            produto_id: itemInput.produto_id,
            nome: itemInput.nome,
            preco_base: itemInput.preco_base,
            quantidade: quantidadeAdicionar,
            adicionais: itemInput.adicionais ? [...itemInput.adicionais] : undefined,
          };

          set({ items: [...items, newItem] });
        }
      },

      /**
       * Remove um item específico do carrinho pelo seu ID único.
       */
      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      /**
       * Atualiza a quantidade de um item.
       * Caso a quantidade resultante seja menor ou igual a zero, remove o item automaticamente.
       */
      updateQuantity: (id: string, quantidade: number) => {
        if (quantidade <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantidade } : item
          ),
        }));
      },

      /**
       * Limpa completamente o estado do carrinho.
       */
      clearCart: () => {
        set({ items: [] });
      },

      /**
       * Getter: Retorna o número total de unidades de itens presentes no carrinho.
       */
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantidade, 0);
      },

      /**
       * Getter: Retorna o valor monetário total do pedido.
       * Soma o preço base aos adicionais selecionados e multiplica pela quantidade de cada linha.
       */
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const adicionaisTotal = item.adicionais
            ? item.adicionais.reduce((acc, ad) => acc + ad.preco, 0)
            : 0;

          const precoUnitarioTotal = item.preco_base + adicionaisTotal;
          return total + precoUnitarioTotal * item.quantidade;
        }, 0);
      },
    }),
    {
      name: '@cardapio-digital:cart-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
