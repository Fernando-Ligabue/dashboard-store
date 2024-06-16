import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const POST = async (req: NextRequest) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("Stripe-Signature") as string;

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log(`Recebido evento do Stripe: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Sessão de checkout concluída:", session);

      const customerInfo = {
        clerkId: session?.client_reference_id,
        name: session?.customer_details?.name,
        email: session?.customer_details?.email,
      };

      const shippingAddress = {
        street: session?.shipping_details?.address?.line1,
        city: session?.shipping_details?.address?.city,
        state: session?.shipping_details?.address?.state,
        postalCode: session?.shipping_details?.address?.postal_code,
        country: session?.shipping_details?.address?.country,
      };

      console.log("Informações do cliente:", customerInfo);
      console.log("Endereço de envio:", shippingAddress);

      const retrieveSession = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ["line_items.data.price.product"] }
      );

      const lineItems = retrieveSession?.line_items?.data;

      if (!lineItems) {
        console.error("Erro ao recuperar itens do pedido");
        return new NextResponse("Erro ao recuperar itens do pedido", { status: 500 });
      }

      const orderItems = lineItems.map((item: any) => {
        return {
          product: item.price.product.metadata.productId,
          color: item.price.product.metadata.color || "N/A",
          size: item.price.product.metadata.size || "N/A",
          quantity: item.quantity,
        };
      });

      console.log("Itens do pedido:", orderItems);

      await connectToDB();

      const newOrder = new Order({
        customerClerkId: customerInfo.clerkId,
        products: orderItems,
        shippingAddress,
        shippingRate: session?.shipping_cost?.shipping_rate,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
      });

      try {
        await newOrder.save();
        console.log("Pedido salvo com sucesso:", newOrder);
      } catch (saveError) {
        console.error("Erro ao salvar o pedido:", saveError);
        return new NextResponse("Erro ao salvar o pedido", { status: 500 });
      }

      let customer;
      try {
        customer = await Customer.findOne({ clerkId: customerInfo.clerkId });

        if (customer) {
          customer.orders.push(newOrder._id);
        } else {
          customer = new Customer({
            ...customerInfo,
            orders: [newOrder._id],
          });
        }

        await customer.save();
        console.log("Cliente salvo com sucesso:", customer);
      } catch (customerError) {
        console.error("Erro ao salvar o cliente:", customerError);
        return new NextResponse("Erro ao salvar o cliente", { status: 500 });
      }
    }

    return new NextResponse("Pedido efetuado com sucesso!", { status: 200 });
  } catch (err) {
    console.error("[webhooks_POST]", err);
    return new NextResponse("Ocorreu um erro ao processar o seu pedido!", { status: 500 });
  }
};
