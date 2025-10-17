import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('👤 Creating users...');
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
    },
  });

  console.log(`✅ Created ${3} users`);

  // Create Orders
  console.log('📦 Creating orders...');
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      total: 99.99,
      status: 'CONFIRMED',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user1.id,
      total: 149.50,
      status: 'PROCESSING',
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: user2.id,
      total: 299.99,
      status: 'SHIPPED',
    },
  });

  const order4 = await prisma.order.create({
    data: {
      userId: user2.id,
      total: 49.99,
      status: 'DELIVERED',
    },
  });

  const order5 = await prisma.order.create({
    data: {
      userId: user3.id,
      total: 199.99,
      status: 'PENDING',
    },
  });

  console.log(`✅ Created ${5} orders`);

  // Create Payments
  console.log('💳 Creating payments...');
  const payment1 = await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 99.99,
      status: 'COMPLETED',
      paymentMethod: 'credit_card',
      transactionId: 'txn_1234567890',
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: 149.50,
      status: 'COMPLETED',
      paymentMethod: 'paypal',
      transactionId: 'txn_0987654321',
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      orderId: order3.id,
      amount: 299.99,
      status: 'COMPLETED',
      paymentMethod: 'credit_card',
      transactionId: 'txn_1122334455',
    },
  });

  const payment4 = await prisma.payment.create({
    data: {
      orderId: order4.id,
      amount: 49.99,
      status: 'COMPLETED',
      paymentMethod: 'debit_card',
      transactionId: 'txn_5544332211',
    },
  });

  const payment5 = await prisma.payment.create({
    data: {
      orderId: order5.id,
      amount: 199.99,
      status: 'PROCESSING',
      paymentMethod: 'credit_card',
      transactionId: 'txn_9988776655',
    },
  });

  console.log(`✅ Created ${5} payments`);

  // Create Notifications
  console.log('📧 Creating notifications...');
  await prisma.notification.create({
    data: {
      orderId: order1.id,
      type: 'ORDER_CREATED',
      channel: 'EMAIL',
      recipient: user1.email,
      subject: 'Order Confirmation',
      message: `Your order #${order1.id} has been confirmed!`,
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      orderId: order1.id,
      type: 'PAYMENT_COMPLETED',
      channel: 'EMAIL',
      recipient: user1.email,
      subject: 'Payment Successful',
      message: `Payment of $${payment1.amount} has been processed successfully.`,
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      orderId: order3.id,
      type: 'ORDER_SHIPPED',
      channel: 'EMAIL',
      recipient: user2.email,
      subject: 'Order Shipped',
      message: `Your order #${order3.id} has been shipped!`,
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      orderId: order4.id,
      type: 'ORDER_DELIVERED',
      channel: 'SMS',
      recipient: user2.email,
      subject: 'Order Delivered',
      message: `Your order #${order4.id} has been delivered!`,
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      orderId: order5.id,
      type: 'ORDER_CREATED',
      channel: 'PUSH',
      recipient: user3.email,
      message: `Your order #${order5.id} has been created and is pending payment.`,
      status: 'PENDING',
    },
  });

  console.log(`✅ Created ${5} notifications`);

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const userCount = await prisma.user.count();
  const orderCount = await prisma.order.count();
  const paymentCount = await prisma.payment.count();
  const notificationCount = await prisma.notification.count();

  console.log(`👥 Users: ${userCount}`);
  console.log(`📦 Orders: ${orderCount}`);
  console.log(`💳 Payments: ${paymentCount}`);
  console.log(`📧 Notifications: ${notificationCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

