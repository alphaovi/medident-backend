import { SaleOrder } from './salesOrder.model.js';
import { ISaleOrder, ISaleOrderItem } from './salesOrder.interface.js';

export class SaleOrderService {
  public static async createOrder(payload: Partial<ISaleOrder>): Promise<ISaleOrder> {
    let subTotal = 0;
    let calculatedProducts: ISaleOrderItem[] = [];
<<<<<<< HEAD
=======
    const orderState = payload.stateOrRegion || "DefaultState";
    const mainCustomer = payload.customer;
>>>>>>> main

    if (payload.products && payload.products.length > 0) {
      calculatedProducts = payload.products.map((item: any) => {
        const totalPrice = item.quantity * item.unitPrice;
        let discountAmount = 0;

        if (item.discountType === 'percentage') {
          discountAmount = (totalPrice * item.discountValue) / 100;
        } else if (item.discountType === 'fixed') {
          discountAmount = item.discountValue;
        }

        if (discountAmount > totalPrice) {
          discountAmount = totalPrice;
        }

        const afterDiscount = totalPrice - discountAmount;
        subTotal += afterDiscount;

        return {
          ...item,
<<<<<<< HEAD
=======
          state: orderState,
          customer: item.customer || mainCustomer,
>>>>>>> main
          totalPrice,
          discountAmount,
          afterDiscount
        };
      });
    }

    let generalDiscountAmount = 0;
    const genDiscType = payload.generalDiscountType || 'fixed';
    const genDiscVal = payload.generalDiscountValue || 0;

    if (genDiscType === 'percentage') {
      generalDiscountAmount = (subTotal * genDiscVal) / 100;
    } else {
      generalDiscountAmount = genDiscVal;
    }

    if (generalDiscountAmount > subTotal) {
      generalDiscountAmount = subTotal;
    }

    const grandTotal = subTotal - generalDiscountAmount;

    const payments = payload.payments || [];
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = grandTotal - paidAmount;

    const orderData = {
      ...payload,
<<<<<<< HEAD
=======
      stateOrRegion: orderState,
      customer: mainCustomer,
>>>>>>> main
      products: calculatedProducts,
      generalDiscountType: genDiscType,
      generalDiscountValue: genDiscVal,
      generalDiscountAmount,
      subTotal,
      grandTotal,
      paidAmount,
      dueAmount: dueAmount < 0 ? 0 : dueAmount,
      payments,
      status: payload.status || 'pending'
    };

    const newOrder = await SaleOrder.create(orderData);
    return newOrder;
  }

  public static async getAllOrders() {
<<<<<<< HEAD
    return await SaleOrder.find().populate('products.customer products.product');
  }

  public static async getOrderById(id: string) {
    return await SaleOrder.findById(id).populate('products.customer products.product');
=======
    return await SaleOrder.find().populate('customer products.customer products.product');
  }

  public static async getOrderById(id: string) {
    return await SaleOrder.findById(id).populate('customer products.customer products.product');
  }

  public static async updateOrder(id: string, payload: Partial<ISaleOrder>): Promise<ISaleOrder | null> {
    const existingOrder = await SaleOrder.findById(id);
    if (!existingOrder) {
      return null;
    }

    let subTotal = existingOrder.subTotal;
    let calculatedProducts = existingOrder.products;
    const orderState = payload.stateOrRegion || existingOrder.stateOrRegion;
    const orderCustomer = payload.customer || existingOrder.customer;

    if (payload.products && payload.products.length > 0) {
      subTotal = 0;
      calculatedProducts = payload.products.map((item: any) => {
        const totalPrice = item.quantity * item.unitPrice;
        let discountAmount = 0;

        if (item.discountType === 'percentage') {
          discountAmount = (totalPrice * item.discountValue) / 100;
        } else if (item.discountType === 'fixed') {
          discountAmount = item.discountValue;
        }

        if (discountAmount > totalPrice) {
          discountAmount = totalPrice;
        }

        const afterDiscount = totalPrice - discountAmount;
        subTotal += afterDiscount;

        return {
          ...item,
          state: orderState,
          customer: item.customer || orderCustomer,
          totalPrice,
          discountAmount,
          afterDiscount
        };
      });
    }

    const genDiscType = payload.generalDiscountType !== undefined ? payload.generalDiscountType : existingOrder.generalDiscountType;
    const genDiscVal = payload.generalDiscountValue !== undefined ? payload.generalDiscountValue : existingOrder.generalDiscountValue;

    let generalDiscountAmount = 0;
    if (genDiscType === 'percentage') {
      generalDiscountAmount = (subTotal * genDiscVal) / 100;
    } else {
      generalDiscountAmount = genDiscVal;
    }

    if (generalDiscountAmount > subTotal) {
      generalDiscountAmount = subTotal;
    }

    const grandTotal = subTotal - generalDiscountAmount;

    const payments = payload.payments !== undefined ? payload.payments : existingOrder.payments;
    const paidAmount = payments.reduce((sum, p: any) => sum + p.amount, 0);
    const dueAmount = grandTotal - paidAmount;

    const updatedData = {
      ...payload,
      stateOrRegion: orderState,
      customer: orderCustomer,
      products: calculatedProducts,
      generalDiscountType: genDiscType,
      generalDiscountValue: genDiscVal,
      generalDiscountAmount,
      subTotal,
      grandTotal,
      paidAmount,
      dueAmount: dueAmount < 0 ? 0 : dueAmount,
      payments
    };

    const updatedOrder = await SaleOrder.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true
    }).populate('customer products.customer products.product');

    return updatedOrder;
  }

  public static async updateStatus(id: string, status: string): Promise<ISaleOrder | null> {
    return await SaleOrder.findByIdAndUpdate(id, { status }, { new: true });
  }

  public static async deleteOrder(id: string): Promise<ISaleOrder | null> {
    return await SaleOrder.findByIdAndDelete(id);
>>>>>>> main
  }
}