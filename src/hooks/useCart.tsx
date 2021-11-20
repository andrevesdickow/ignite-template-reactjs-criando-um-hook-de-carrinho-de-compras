import { filter, find, get, map, some } from 'lodash';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart: Product[] = [];

      // busca as informações do produto
      const { data } = await api.get(`/products/${productId}`);

      // se já existe no carrinho, incrementa a quantidade
      if (some(cart, ['id', productId])) {
        const result = await api.get(`/stock/${productId}`);
        const productToAdd = find(cart, ['id', productId]);

        const stock: Stock = result.data;
        const newAmount = productToAdd ? productToAdd.amount : 1

        if (newAmount >= stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        newCart = map(cart, product => {
          if (product.id === productId) {
            return {
              ...product,
              amount: get(product, 'amount', 0) + 1
            }
          }
          return product
        });

        // atualiza o estado
        setCart(newCart)
      } else {
        newCart = [
          ...cart,
          { ...data, amount: 1 }
        ];

        // atualiza o estado
        setCart(newCart);
      }

      // atualiza as informações no localStorage
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!some(cart, ['id', productId])) {
        throw new Error('Erro na remoção do produto');
      }

      const newCart = filter(cart, ({ id }) => id !== productId);

      // atualiza o estado
      setCart(newCart);

      // atualiza o localStorage
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const result = await api.get(`/stock/${productId}`);

      const stock: Stock = result.data;

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = map(cart, product => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }
        return product
      });

      // atualiza o estado
      setCart(newCart);

      // atualiza o localStorage
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
