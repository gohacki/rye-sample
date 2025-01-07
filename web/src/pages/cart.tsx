import { useState } from 'react';
import axios from 'axios';

export default function CartPage() {
  const [infoMessage, setInfoMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const handleUpdateBuyer = async () => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/update-buyer', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        address1: '1460 Broadway',
        city: 'New York City',
        provinceCode: 'NY',
        postalCode: '10036',
      });
      setInfoMessage(`Buyer updated! Cart shipping cost: ${data.cost.shipping.displayValue}`);
    } catch (err: any) {
      setInfoMessage(err?.response?.data?.error || 'Error updating buyer');
    }
  };

  const handleSubmitCart = async () => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/submit-cart', {});
      if (data.errors && data.errors.length > 0) {
        setCheckoutMessage(`Submit errors: ${JSON.stringify(data.errors)}`);
      } else {
        setCheckoutMessage(`Cart submitted! ${JSON.stringify(data.cart)}`);
      }
    } catch (err: any) {
      setCheckoutMessage(err?.response?.data?.error || 'Error submitting cart');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      <p>
        This demo does not show cart items explicitly. We rely on our Express server 
        to track a single in-memory cart. <br />
        Click the buttons below to update shipping info and then submit the cart.
      </p>

      <div className="mt-4 space-x-3">
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handleUpdateBuyer}
        >
          Update Buyer Info
        </button>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={handleSubmitCart}
        >
          Submit Cart
        </button>
      </div>

      <p className="mt-4 text-blue-600">{infoMessage}</p>
      <p className="mt-4 text-red-600">{checkoutMessage}</p>
    </div>
  );
}
