import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { request, gql } from 'graphql-request';

// ----------------------------------------------------
// 1. Basic config
// ----------------------------------------------------
const app = express();
const PORT = 4000;

// NOTE: In production, do NOT expose these in code.
//       Store them in environment variables or a secrets manager.
const RYE_API_ENDPOINT = 'https://graphql.api.rye.com/v1/query.';
const RYE_AUTH_HEADER = 'Basic ';  // from console.rye.com
const SHOPPER_IP = ''; // Or your shopper's IP address, if available

app.use(cors());
app.use(bodyParser.json());

// For demo: store cartId in-memory
let cartId: string | null = null;

// ----------------------------------------------------
// 2. Create Cart
// ----------------------------------------------------
app.post('/api/create-cart', async (req, res) => {
  try {
    // We will create a new cart with a single Amazon product as an example.
    // You can provide multiple items if you wish.
    const createCartMutation = gql`
      mutation CreateCart($productId: String!, $quantity: Int!) {
        createCart(
          input: {
            items: {
              amazonCartItemsInput: [{
                productId: $productId
                quantity: $quantity
              }]
            }
          }
        ) {
          cart {
            id
            cost {
              total {
                displayValue
                value
              }
            }
            stores {
              ... on AmazonStore {
                cartLines {
                  product {
                    id
                    title
                  }
                  quantity
                }
              }
            }
          }
          errors {
            code
            message
          }
        }
      }
    `;

    const variables = {
      productId: req.body.productId, // e.g. "B08CQDF382"
      quantity: req.body.quantity || 1,
    };

    const response = await request(
      RYE_API_ENDPOINT,
      createCartMutation,
      variables,
      {
        Authorization: RYE_AUTH_HEADER,
        'Rye-Shopper-IP': SHOPPER_IP,
      }
    );

    if (response.createCart.errors && response.createCart.errors.length > 0) {
      return res.status(400).json({ errors: response.createCart.errors });
    }

    cartId = response.createCart.cart.id;
    return res.json(response.createCart.cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error creating cart' });
  }
});

// ----------------------------------------------------
// 3. Add More Items to Cart
// ----------------------------------------------------
app.post('/api/add-cart-items', async (req, res) => {
  try {
    if (!cartId) {
      return res.status(400).json({ error: 'No cart exists yet!' });
    }

    const addCartItemsMutation = gql`
      mutation AddCartItems($cartId: ID!, $productId: String!, $quantity: Int!) {
        addCartItems(
          input: {
            id: $cartId
            items: {
              amazonCartItemsInput: [{
                productId: $productId
                quantity: $quantity
              }]
            }
          }
        ) {
          cart {
            id
            cost {
              total {
                displayValue
                value
              }
            }
            stores {
              ... on AmazonStore {
                cartLines {
                  product {
                    id
                    title
                  }
                  quantity
                }
              }
            }
          }
          errors {
            code
            message
          }
        }
      }
    `;

    const variables = {
      cartId,
      productId: req.body.productId, // e.g. "B00A2KD8NY"
      quantity: req.body.quantity || 1,
    };

    const response = await request(
      RYE_API_ENDPOINT,
      addCartItemsMutation,
      variables,
      {
        Authorization: RYE_AUTH_HEADER,
        'Rye-Shopper-IP': SHOPPER_IP,
      }
    );

    if (response.addCartItems.errors && response.addCartItems.errors.length > 0) {
      return res.status(400).json({ errors: response.addCartItems.errors });
    }

    return res.json(response.addCartItems.cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error adding items to cart' });
  }
});

// ----------------------------------------------------
// 4. Update Buyer Identity (Shipping Address)
// ----------------------------------------------------
app.post('/api/update-buyer', async (req, res) => {
  try {
    if (!cartId) {
      return res.status(400).json({ error: 'No cart to update buyer for!' });
    }

    const updateBuyerMutation = gql`
      mutation UpdateCartBuyer($cartId: ID!, $buyer: BuyerIdentityInput!) {
        updateCartBuyerIdentity(
          input: {
            id: $cartId
            buyerIdentity: $buyer
          }
        ) {
          cart {
            id
            cost {
              subtotal { displayValue }
              shipping { displayValue }
              total { displayValue }
            }
          }
          errors {
            code
            message
          }
        }
      }
    `;

    const variables = {
      cartId,
      buyer: {
        firstName: req.body.firstName || 'Jane',
        lastName: req.body.lastName || 'Doe',
        email: req.body.email || 'jane@example.com',
        address1: req.body.address1 || '1460 Broadway',
        city: req.body.city || 'New York City',
        provinceCode: req.body.provinceCode || 'NY',
        countryCode: 'US',
        postalCode: req.body.postalCode || '10036',
      },
    };

    const response = await request(
      RYE_API_ENDPOINT,
      updateBuyerMutation,
      variables,
      {
        Authorization: RYE_AUTH_HEADER,
        'Rye-Shopper-IP': SHOPPER_IP,
      }
    );

    if (
      response.updateCartBuyerIdentity.errors &&
      response.updateCartBuyerIdentity.errors.length > 0
    ) {
      return res
        .status(400)
        .json({ errors: response.updateCartBuyerIdentity.errors });
    }

    return res.json(response.updateCartBuyerIdentity.cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error updating buyer identity' });
  }
});

// ----------------------------------------------------
// 5. Submit Cart (Checkout)
// ----------------------------------------------------
// IMPORTANT: For Sell Anything API + "backend ordering" flow,
// you typically pass a developer's *own* credit card token here
// (e.g. via Spreedly) so that you can reorder from Amazon. 
// For demonstration, we'll omit tokenization and assume we have a 
// placeholder `paymentToken` from somewhere.
app.post('/api/submit-cart', async (req, res) => {
  try {
    if (!cartId) {
      return res.status(400).json({ error: 'No cart to submit!' });
    }

    const paymentToken = '<YOUR_SPREEDLY_OR_RYE_PAY_TOKEN>';
    const submitCartMutation = gql`
      mutation SubmitCart($cartId: ID!, $token: String!) {
        submitCart(input: {
          id: $cartId
          token: $token
        }) {
          cart {
            id
            stores {
              ... on AmazonStore {
                store
                status
                errors {
                  code
                  message
                }
              }
            }
          }
          errors {
            code
            message
          }
        }
      }
    `;

    const variables = {
      cartId,
      token: paymentToken,
    };

    const response = await request(
      RYE_API_ENDPOINT,
      submitCartMutation,
      variables,
      {
        Authorization: RYE_AUTH_HEADER,
        'Rye-Shopper-IP': SHOPPER_IP,
      }
    );

    // In practice, you'd check carefully for top-level errors or store-level errors
    return res.json(response.submitCart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error submitting cart' });
  }
});

// ----------------------------------------------------
// Start server
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`Rye demo backend listening on http://localhost:${PORT}`);
});
