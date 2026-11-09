import { SaleOrder } from './salesOrder.model.js';
import { ISaleOrder, ISaleOrderItem } from './salesOrder.interface.js';

export class SaleOrderService {
  public static async createOrder(payload: Partial<ISaleOrder>): Promise<ISaleOrder> {
    let subTotal = 0;
    let calculatedProducts: ISaleOrderItem[] = [];

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
    return await SaleOrder.find().populate('products.customer products.product');
  }

  public static async getOrderById(id: string) {
    return await SaleOrder.findById(id).populate('products.customer products.product');
  }
}