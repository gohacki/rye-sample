import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function Home() {
  // Some mock Amazon product IDs you want to sell:
  const products = [
    { id: 'B07PWYB6LZ', title: 'Egg Separator' },
    { id: 'B08CQDF382', title: 'CeraVe Cleanser' },
  ];

  const [message, setMessage] = useState('');

  const handleCreateCart = async (productId: string) => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/create-cart', {
        productId,
        quantity: 1,
      });
      setMessage(`Cart created! Cart ID: ${data.id}`);
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Error creating cart');
    }
  };

  const handleAddToExistingCart = async (productId: string) => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/add-cart-items', {
        productId,
        quantity: 1,
      });
      setMessage(`Added ${productId} to cart ID ${data.id}`);
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'Error adding to cart');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sample Amazon Products</h1>

      <ul className="space-y-3">
        {products.map((product) => (
          <li key={product.id} className="border p-2 rounded">
            <p className="font-semibold">{product.title}</p>
            <p>Amazon ID: {product.id}</p>
            <div className="mt-2 flex gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => handleCreateCart(product.id)}
              >
                Create New Cart with This Item
              </button>

              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => handleAddToExistingCart(product.id)}
              >
                Add to Existing Cart
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-red-600">{message}</p>

      <div className="mt-8">
        <Link href="/cart" className="text-blue-500 underline">
          Go to cart page
        </Link>
      </div>
    </div>
  );
}
