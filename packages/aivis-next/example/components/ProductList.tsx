import { Button } from '../Button';

// =============================================================================
// 测试组件：产品列表
// Props：title, products (数组), onAddToCart, onRemove, filter
// =============================================================================
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface ProductListProps {
  title: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemove?: (productId: string) => void;
  filter?: string;
  maxItems?: number;
}

export function ProductList({ title, products, onAddToCart, filter, maxItems = 10 }: ProductListProps) {
  const filteredProducts = filter ? products.filter((p) => p.category === filter || p.name.includes(filter)) : products;

  return (
    <div className="card">
      <h4>{title}</h4>
      <p className="text-sm text-gray-500">共 {filteredProducts.length} 个商品</p>
      <div className="mt-2 space-y-2">
        {filteredProducts.slice(0, maxItems).map((product) => (
          <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>
              {product.name} - ¥{product.price}
            </span>
            <Button size="sm" onClick={() => onAddToCart(product)}>
              添加
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
