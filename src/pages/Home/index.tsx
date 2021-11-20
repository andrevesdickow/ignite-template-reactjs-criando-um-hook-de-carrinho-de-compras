import { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';
import { get, map } from 'lodash';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    return {
      ...sumAmount,
      [String(product.id)]: get(product, 'amount', 0)
    }
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() {
      const { data } = await api.get('/products')
      setProducts(map(data, item => ({
        ...item,
        priceFormatted: formatPrice(item.price)
      })))
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id)
  }

  return (
    <ProductList>
      {
        map(products, product => (
          <li key={String(product.id)}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            <span>{product.priceFormatted}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {get(cartItemsAmount, String(product.id), 0) || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        ))
      }
    </ProductList>
  );
};

export default Home;
