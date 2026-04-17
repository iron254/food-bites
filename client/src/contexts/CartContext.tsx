import React, { createContext, useContext, useReducer, useCallback } from "react";

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; menuItemId: number }
  | { type: "UPDATE_QUANTITY"; menuItemId: number; quantity: number }
  | { type: "CLEAR_CART" };

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: "",
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      // If adding from a different restaurant, clear the cart first
      if (state.restaurantId && state.restaurantId !== action.item.restaurantId) {
        return {
          items: [action.item],
          restaurantId: action.item.restaurantId,
          restaurantName: action.item.restaurantName,
        };
      }
      const existing = state.items.find((i) => i.menuItemId === action.item.menuItemId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuItemId === action.item.menuItemId
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        restaurantId: action.item.restaurantId,
        restaurantName: action.item.restaurantName,
        items: [...state.items, action.item],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.menuItemId !== action.menuItemId),
        restaurantId: state.items.length <= 1 ? null : state.restaurantId,
      };
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.menuItemId !== action.menuItemId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR_CART":
      return initialState;
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string;
  totalItems: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    dispatch({ type: "REMOVE_ITEM", menuItemId });
  }, []);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", menuItemId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
