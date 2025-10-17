# Kafka-NestJS-Microservices

A microservices architecture built with NestJS and Apache Kafka for event-driven communication, managed by Nx monorepo tooling.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technical Stack](#technical-stack)
- [Project Structure](#project-structure)
- [Microservices](#microservices)
- [Configuration Files](#configuration-files)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Applications](#running-the-applications)
- [Development Commands](#development-commands)
- [Use Cases](#use-cases)
- [API Gateway Endpoints](#api-gateway-endpoints)

## 🎯 Overview

This project demonstrates a microservices architecture using NestJS framework with Apache Kafka as the message broker. The architecture consists of an API Gateway that handles incoming HTTP requests and three microservices (Order, Payment, and Notification) that communicate asynchronously through Kafka topics.

## 🏗️ Architecture

```
┌─────────────────┐
│   API Gateway   │  (HTTP REST API - Port 3000)
│   (Port 3000)   │
└────────┬────────┘
         │
         │ Kafka Messages
         │
    ┌────┴────────────────────┐
    │                         │
    │   Apache Kafka Broker   │
    │     (Port 9092)         │
    │                         │
    └─┬───────────┬──────────┬┘
      │           │          │
      │           │          │
┌─────▼─────┐ ┌──▼──────┐ ┌─▼───────────┐
│   Order   │ │ Payment │ │Notification │
│Microservice│ │Microservice│ │Microservice│
└───────────┘ └─────────┘ └─────────────┘
```

### Communication Flow

**Request-Response Pattern (for queries):**
1. **API Gateway** receives HTTP requests from clients
2. **API Gateway** sends request to Kafka topic using `send()` pattern
3. **Microservice** receives request via `@MessagePattern` handler
4. **Microservice** processes request and returns response
5. **API Gateway** receives response and returns to client (with timeout)

**Event-Driven Pattern (for side effects):**
1. **Microservice** completes operation (e.g., order created)
2. **Microservice** publishes event to Kafka topic using `emit()`
3. **Other microservices** listen to event via `@MessagePattern` handler
4. **Microservices** process event asynchronously (e.g., send notification)

## 🛠️ Technical Stack

### Core Technologies

- **NestJS** (v11.0.15) - Progressive Node.js framework
- **Apache Kafka** (KafkaJS v2.2.4) - Distributed event streaming platform
- **TypeScript** (v5.8.3) - Typed superset of JavaScript
- **Nx** (v20.7.2) - Smart monorepo build system

### Key Dependencies

- `@nestjs/microservices` - NestJS microservices module
- `@nestjs/platform-express` - Express platform adapter
- `kafkajs` - Modern Apache Kafka client for Node.js
- `rxjs` - Reactive Extensions for JavaScript
- `axios` - Promise-based HTTP client
- `prisma` - Next-generation ORM for Node.js
- `@prisma/client` - Prisma Client for database operations

### Development Tools

- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Webpack** - Module bundler
- **SWC** - Fast TypeScript/JavaScript compiler

### Infrastructure

- **Docker Compose** - Container orchestration
- **Zookeeper** - Kafka cluster coordination
- **Kafka** - Message broker
- **PostgreSQL** (v16-alpine) - Relational database

## 📁 Project Structure

```
Kafka-NestJS-Microservices/
├── apps/
│   ├── api-gateway/                 # HTTP REST API Gateway
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.controller.ts    # API routes
│   │   │   │   ├── app.service.ts       # Business logic
│   │   │   │   └── app.module.ts        # Module configuration
│   │   │   └── main.ts                  # Bootstrap (Port 3000)
│   │   ├── project.json                 # Nx project configuration
│   │   ├── tsconfig.json                # TypeScript configuration
│   │   └── webpack.config.js            # Webpack build configuration
│   │
│   ├── order-microservice/          # Order processing service
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.controller.ts    # Kafka message handlers
│   │   │   │   ├── app.service.ts       # Order business logic
│   │   │   │   └── app.module.ts        # Kafka client setup
│   │   │   └── main.ts                  # Kafka consumer bootstrap
│   │   └── ...
│   │
│   ├── payment-microservice/        # Payment processing service
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.controller.ts    # Kafka message handlers
│   │   │   │   ├── app.service.ts       # Payment business logic
│   │   │   │   └── app.module.ts        # Kafka client setup
│   │   │   └── main.ts                  # Kafka consumer bootstrap
│   │   └── ...
│   │
│   └── notification-microservice/   # Notification service
│       ├── src/
│       │   ├── app/
│       │   │   ├── app.controller.ts    # Kafka message handlers
│       │   │   ├── app.service.ts       # Notification logic
│       │   │   └── app.module.ts        # Module configuration
│       │   └── main.ts                  # Kafka consumer bootstrap
│       └── ...
│
├── libs/
│   └── prisma/                      # Shared Prisma library
│       └── src/
│           ├── lib/
│           │   ├── prisma.service.ts    # Prisma service
│           │   └── prisma.module.ts     # Prisma module
│           └── index.ts
│
├── prisma/
│   └── schema.prisma                # Prisma database schema
│
├── generated/
│   └── prisma/                      # Generated Prisma Client
│
├── docker-compose.yml               # Kafka, Zookeeper & PostgreSQL
├── nx.json                          # Nx workspace configuration
├── package.json                     # Dependencies & scripts
├── tsconfig.base.json               # Base TypeScript config
├── .env                             # Environment variables
└── README.md                        # This file
```

## 🎯 Microservices

### 1. API Gateway

- **Type**: HTTP REST API
- **Port**: 3000
- **Responsibility**: Entry point for all client requests (routing layer only)
- **Features**:
  - Exposes RESTful endpoints
  - Routes requests to microservices via Kafka request-response pattern
  - Direct database access only for user management
  - Timeout handling (5-10 seconds)
  - Route: `http://localhost:3000/api`
  - Swagger documentation: `http://localhost:3000/api/docs`

### 2. Order Microservice

- **Type**: Kafka Consumer/Producer
- **Consumer Group**: `order-consumer-group`
- **Responsibility**: Handle order-related operations
- **Features**:
  - Listens to order-related Kafka topics
  - Processes order creation, updates, cancellations
  - Publishes order events to other microservices

### 3. Payment Microservice

- **Type**: Kafka Consumer/Producer
- **Consumer Group**: `payment-consumer-group`
- **Responsibility**: Process payment transactions
- **Features**:
  - Listens to payment-related Kafka topics
  - Handles payment processing
  - Publishes payment status events

### 4. Notification Microservice

- **Type**: Kafka Consumer
- **Consumer Group**: `notification-consumer-group`
- **Responsibility**: Send notifications to users
- **Features**:
  - Listens to notification-related Kafka topics
  - Sends email/SMS/push notifications
  - Handles notification templates

## ⚙️ Configuration Files

### `docker-compose.yml`

Defines the infrastructure services:

```yaml
services:
  zookeeper:
    image: wurstmeister/zookeeper
    ports: ["2181:2181"]
  
  kafka:
    image: wurstmeister/kafka
    ports: ["9092:9092"]
    environment:
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
```

### `nx.json`

Nx workspace configuration for monorepo management:

- **Build System**: Webpack plugin for building applications
- **Linting**: ESLint plugin for code quality
- **Testing**: Jest plugin for unit tests
- **Default Branch**: master

### `package.json`

Project dependencies and workspace configuration:

- **Workspace**: Nx monorepo with private packages
- **Dependencies**: NestJS, Kafka, TypeScript
- **DevDependencies**: Build tools, testing frameworks

### `tsconfig.base.json`

Base TypeScript configuration for all applications:

- **Target**: ES2015
- **Module**: ESNext
- **Decorators**: Enabled (required for NestJS)
- **Source Maps**: Enabled for debugging

### Application-Specific Configs

Each microservice has:

- `project.json` - Nx build, serve, lint, and test targets
- `tsconfig.json` - TypeScript compiler options
- `webpack.config.js` - Webpack bundling configuration
- `jest.config.ts` - Jest testing configuration
- `eslint.config.mjs` - ESLint rules

## 🗄️ Database & Prisma

### Database Schema

The project uses PostgreSQL with Prisma ORM. The database includes the following models:

#### **User Model**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  orders    Order[]
}
```

#### **Order Model**
```prisma
model Order {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  total       Decimal
  status      OrderStatus @default(PENDING)
  payment     Payment?
  notifications Notification[]
}

enum OrderStatus {
  PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
}
```

#### **Payment Model**
```prisma
model Payment {
  id              String        @id @default(uuid())
  orderId         String        @unique
  order           Order         @relation(fields: [orderId], references: [id])
  amount          Decimal
  status          PaymentStatus @default(PENDING)
  paymentMethod   String
  transactionId   String?       @unique
}

enum PaymentStatus {
  PENDING | PROCESSING | COMPLETED | FAILED | REFUNDED
}
```

#### **Notification Model**
```prisma
model Notification {
  id        String             @id @default(uuid())
  orderId   String
  order     Order              @relation(fields: [orderId], references: [id])
  type      NotificationType
  channel   NotificationChannel
  recipient String
  message   String
  status    NotificationStatus @default(PENDING)
}
```

### Prisma Configuration

The Prisma schema is located at `prisma/schema.prisma`. Generated Prisma Client is output to `generated/prisma`.

**Database Connection (Local PostgreSQL):**
```
DATABASE_URL="postgresql://macbook@localhost:5432/kafka_microservices?schema=public"
```

**Note:** By default, the project uses local PostgreSQL. If you prefer Docker PostgreSQL, uncomment the postgres service in `docker-compose.yml` and update the DATABASE_URL to:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kafka_microservices?schema=public"
```

### Shared Prisma Library

The project includes a shared Prisma library at `libs/prisma` that provides:

- **PrismaService**: Global singleton Prisma Client instance
- **PrismaModule**: Global NestJS module for dependency injection
- Automatic connection management (connect on init, disconnect on destroy)
- Database logging for development

All microservices import `@kafka2/prisma` to access the database.

## 🌱 Database Seeding

The project includes a seed script (`prisma/seed.ts`) to populate the database with sample data for testing and development.

### Seed Data Includes:

**Users (3)**:
- John Doe (john.doe@example.com)
- Jane Smith (jane.smith@example.com)
- Bob Wilson (bob.wilson@example.com)

**Orders (5)**:
- Orders in various statuses: CONFIRMED, PROCESSING, SHIPPED, DELIVERED, PENDING
- Total amounts ranging from $49.99 to $299.99

**Payments (5)**:
- Payment methods: credit_card, debit_card, paypal
- Statuses: COMPLETED, PROCESSING
- Transaction IDs generated

**Notifications (5)**:
- Types: ORDER_CREATED, PAYMENT_COMPLETED, ORDER_SHIPPED, ORDER_DELIVERED
- Channels: EMAIL, SMS, PUSH
- Statuses: SENT, PENDING

### Run Seed:

```bash
npm run prisma:seed
```

### Custom Seed:

Edit `prisma/seed.ts` to add your own sample data.

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **Docker** - [Download](https://www.docker.com/get-started)
- **Docker Compose** - Usually included with Docker Desktop
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/) or install via Homebrew: `brew install postgresql`

Verify installations:

```bash
node --version
npm --version
docker --version
docker-compose --version
psql --version
pg_isready  # Check if PostgreSQL is running
```

**Start PostgreSQL** (if not running):
```bash
# macOS with Homebrew
brew services start postgresql

# Or manually
pg_ctl -D /usr/local/var/postgres start
```

## 📦 Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd Kafka-NestJS-Microservices
```

2. **Install dependencies**:

```bash
npm install
```

This will install all dependencies for the entire monorepo.

3. **Start Kafka infrastructure**:

```bash
npm run docker:up
# Starts: Kafka & Zookeeper (PostgreSQL runs locally)
```

Verify services are running:

```bash
docker ps
# Should show: kafka and zookeeper containers
```

4. **Create PostgreSQL database**:

```bash
# Create database (if it doesn't exist)
createdb kafka_microservices

# Or using psql:
psql -d postgres -c "CREATE DATABASE kafka_microservices;"
```

5. **Generate Prisma Client**:

```bash
npm run prisma:generate
```

6. **Run database migrations**:

```bash
npm run prisma:migrate
# This will create the database tables based on schema.prisma
```

When prompted for migration name, enter: `init`

7. **(Optional) Seed the database with sample data**:

```bash
npm run prisma:seed
```

This will create:
- 3 sample users
- 5 sample orders
- 5 sample payments
- 5 sample notifications

## 🚀 Running the Applications

### Quick Start - Run All Services with One Command

**Prerequisites:**
1. Ensure PostgreSQL is running locally (`pg_isready`)
2. Database created (`createdb kafka_microservices`)
3. Migrations run (`npm run prisma:migrate`)

**Start Kafka infrastructure**:
```bash
npm run docker:up
# Starts Kafka & Zookeeper
```

**Then run all microservices in parallel** (in a single terminal):
```bash
npm run dev
```

This will start all 4 applications simultaneously:
- API Gateway on `http://localhost:3000/api`
- Order Microservice (Kafka consumer)
- Payment Microservice (Kafka consumer)
- Notification Microservice (Kafka consumer)

Press `Ctrl+C` to stop all services.

### Start Services Individually

If you prefer to run services in separate terminals:

**Start API Gateway**:
```bash
npm run dev:gateway
# or: npx nx serve api-gateway
```

**Start Order Microservice**:
```bash
npm run dev:order
# or: npx nx serve order-microservice
```

**Start Payment Microservice**:
```bash
npm run dev:payment
# or: npx nx serve payment-microservice
```

**Start Notification Microservice**:
```bash
npm run dev:notification
# or: npx nx serve notification-microservice
```

### Start Infrastructure Only

To start only Kafka and Zookeeper:

```bash
docker-compose up -d
```

To stop:

```bash
docker-compose down
```

### Build for Production

Build all applications:

```bash
npx nx run-many --target=build --all
```

Build specific application:

```bash
npx nx build api-gateway
npx nx build order-microservice
npx nx build payment-microservice
npx nx build notification-microservice
```

Production builds will be in `dist/apps/<app-name>/`.

## 🔧 Development Commands

### NPM Scripts (Recommended)

```bash
# Development
npm run dev                    # Run all services in parallel (no debugger)
npm run dev:gateway            # Run API Gateway only
npm run dev:order              # Run Order Microservice only
npm run dev:payment            # Run Payment Microservice only
npm run dev:notification       # Run Notification Microservice only

# Build
npm run build:all              # Build all applications

# Testing
npm run test:all               # Run all tests

# Linting
npm run lint:all               # Lint all applications

# Docker/Infrastructure
npm run docker:up              # Start Kafka, Zookeeper & PostgreSQL
npm run docker:down            # Stop all Docker services
npm run docker:logs            # View logs from all services

# Prisma/Database
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Create and run new migration
npm run prisma:migrate:deploy  # Deploy migrations (production)
npm run prisma:studio          # Open Prisma Studio (DB GUI)
npm run prisma:seed            # Seed database with sample data
npm run db:push                # Push schema changes without migration
npm run db:reset               # Reset database and run migrations
```

### Nx Commands (Advanced)

```bash
# Serve an application in development mode
npx nx serve <app-name>

# Build an application
npx nx build <app-name>

# Run tests
npx nx test <app-name>

# Run all tests
npx nx run-many --target=test --all

# Lint code
npx nx lint <app-name>

# Lint all applications
npx nx run-many --target=lint --all

# View dependency graph
npx nx graph

# Run multiple targets in parallel
npx nx run-many --target=serve --all --parallel
```

### Docker Commands

```bash
# Start Kafka infrastructure
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Restart services
docker-compose restart
```

### Kafka Management

```bash
# Enter Kafka container
docker exec -it <kafka-container-id> bash

# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Create a topic
kafka-topics.sh --create --topic <topic-name> --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# Consume messages from a topic
kafka-console-consumer.sh --topic <topic-name> --from-beginning --bootstrap-server localhost:9092
```

### Debugging

The debugger is disabled by default to avoid port conflicts when running multiple services. To enable debugging for a specific service:

**Edit the service's `project.json`** (e.g., `apps/api-gateway/project.json`):

```json
{
  "serve": {
    "options": {
      "inspect": 9229  // Use different ports: 9229, 9230, 9231, 9232
    },
    "configurations": {
      "development": {
        "inspect": 9229
      }
    }
  }
}
```

**Recommended debug ports:**
- API Gateway: `9229`
- Order Microservice: `9230`
- Payment Microservice: `9231`
- Notification Microservice: `9232`

## 🔄 Kafka Message Patterns

This project uses two Kafka communication patterns:

### 1. Request-Response Pattern (`send()`)

Used for: Synchronous operations where the API Gateway needs a response

**Topics:**
- `order.create` - Create a new order
- `order.findAll` - Get all orders
- `order.findById` - Get order by ID
- `order.findByUserId` - Get orders by user ID
- `payment.create` - Create a payment
- `payment.process` - Process a payment
- `payment.findAll` - Get all payments
- `payment.findById` - Get payment by ID
- `payment.findByOrderId` - Get payment by order ID
- `notification.findAll` - Get all notifications
- `notification.findByOrderId` - Get notifications by order ID

**Implementation:**
```typescript
// API Gateway (Producer)
const response = await firstValueFrom(
  this.kafkaClient
    .send('order.create', data)
    .pipe(timeout(5000))
);

// Order Microservice (Consumer)
@MessagePattern('order.create')
async createOrder(@Payload() data: CreateOrderDto) {
  const order = await this.orderService.createOrder(data);
  return { success: true, data: order };
}
```

### 2. Event-Driven Pattern (`emit()`)

Used for: Asynchronous operations and cross-service notifications

**Topics:**
- `order.created` - Order was created (→ Notification service)
- `order.confirmed` - Order was confirmed (→ Notification service)
- `payment.completed` - Payment succeeded (→ Order & Notification services)
- `payment.failed` - Payment failed (→ Order & Notification services)
- `payment.refunded` - Payment was refunded (→ Order & Notification services)

**Implementation:**
```typescript
// Order Microservice (Producer)
this.kafkaClient.emit('order.created', {
  orderId: order.id,
  userId: order.userId,
  total: order.total,
  status: order.status,
});

// Notification Microservice (Consumer)
@MessagePattern('order.created')
async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
  await this.notificationService.handleOrderCreated(
    data.orderId,
    data.userId,
    'user@example.com'
  );
}
```

### Key Differences

| Feature | Request-Response (`send()`) | Event-Driven (`emit()`) |
|---------|----------------------------|------------------------|
| **Use Case** | Query data, perform action | Notify other services |
| **Response** | Waits for response | Fire and forget |
| **Timeout** | Has timeout (5-10s) | No timeout |
| **Return Value** | Returns data | No return value |
| **Error Handling** | Can catch errors | Fire and forget |
| **Example** | Get order by ID | Order created notification |

## 💡 Use Cases

### 1. E-Commerce Order Processing

**Flow**:
1. User places an order via API Gateway (`POST /api/orders`)
2. API Gateway publishes `order.created` event to Kafka
3. Order Microservice processes the order
4. Payment Microservice processes the payment
5. Notification Microservice sends confirmation email

**Benefits**:
- Asynchronous processing
- Decoupled services
- Fault tolerance
- Scalability

### 2. Payment Processing System

**Flow**:
1. Payment request sent to API Gateway
2. Gateway publishes `payment.requested` event
3. Payment Microservice validates and processes payment
4. Publishes `payment.completed` or `payment.failed` event
5. Order Microservice updates order status
6. Notification Microservice sends payment confirmation

**Benefits**:
- Transactional integrity
- Event sourcing
- Audit trail

### 3. Real-Time Notifications

**Flow**:
1. Any microservice publishes notification events
2. Notification Microservice listens to multiple topics
3. Sends appropriate notifications (email, SMS, push)
4. Maintains notification history

**Benefits**:
- Centralized notification logic
- Multi-channel support
- Easy to add new notification types

### 4. Order Fulfillment Workflow

**Flow**:
1. `order.created` → Order Microservice validates inventory
2. `payment.requested` → Payment Microservice processes payment
3. `payment.completed` → Order Microservice updates status
4. `order.confirmed` → Notification Microservice sends confirmation
5. `shipment.created` → External shipping service integration

**Benefits**:
- Orchestrated workflow
- Each step can be retried independently
- Easy to add new steps

## 📚 Swagger API Documentation

The API Gateway includes interactive Swagger documentation for all endpoints.

**Access Swagger UI:**
```
http://localhost:3000/api/docs
```

Features:
- ✅ Interactive API testing
- ✅ Request/Response schemas
- ✅ Try it out functionality
- ✅ Auto-generated from code decorators
- ✅ Grouped by resource (Users, Orders, Payments)

### Swagger Configuration

Swagger is configured in `apps/api-gateway/src/main.ts`:
- All endpoints are automatically documented
- DTOs provide request validation and documentation
- Responses include status codes and descriptions

## 🔌 API Gateway Endpoints

The API Gateway exposes REST endpoints that route requests to microservices via Kafka request-response pattern.

### User Endpoints

```
POST   /api/users              - Create new user
GET    /api/users              - Get all users with their orders
GET    /api/users/:id          - Get user by ID with full details
```

**Example - Create User:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "name": "John Doe"}'
```

### Order Endpoints

```
POST   /api/orders             - Create new order (via order microservice)
GET    /api/orders             - Get all orders (via order microservice)
GET    /api/orders/:id         - Get order by ID (via order microservice)
```

**Example - Create Order:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid-here", "total": 99.99}'
```

This endpoint:
1. API Gateway sends `order.create` request to Kafka
2. Order microservice receives request, creates order in database
3. Order microservice emits `order.created` event for other services
4. Order microservice responds to API Gateway with order data
5. API Gateway returns response to client

### Payment Endpoints

```
POST   /api/payments           - Create and process payment (via payment microservice)
GET    /api/payments           - Get all payments (via payment microservice)
GET    /api/payments/:id       - Get payment by ID (via payment microservice)
GET    /api/payments/order/:orderId - Get payment by order ID (via payment microservice)
```

**Example - Process Payment:**
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order-uuid-here", "amount": 99.99, "paymentMethod": "credit_card"}'
```

This endpoint:
1. API Gateway sends `payment.create` request to Kafka
2. Payment microservice creates payment record in database
3. API Gateway sends `payment.process` request to Kafka
4. Payment microservice processes payment (simulates payment gateway)
5. Payment microservice emits `payment.completed` or `payment.failed` event
6. Order microservice listens and updates order status
7. Notification microservice sends payment confirmation
8. API Gateway returns payment result to client

### Notification Endpoints

```
GET    /api/notifications      - Get all notifications (via notification microservice)
GET    /api/notifications/order/:orderId - Get notifications by order ID
```

## 📊 Understanding the Startup Output

When you run `npm run dev`, you'll see output from all 4 services. Here's what to look for:

### ✅ Success Indicators

```
✔ nx run api-gateway:build
✔ nx run order-microservice:build  
✔ nx run payment-microservice:build
✔ nx run notification-microservice:build
```

```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG 🚀 Application is running on: http://localhost:3000/api
```

```
[Nest] LOG [ServerKafka] INFO [ConsumerGroup] Consumer has joined the group
[Nest] LOG [NestMicroservice] Nest microservice successfully started
[Nest] LOG 🚀 Payment Microservice is listening to kafka...
```

### ⚠️ Warnings You Can Ignore

**Debugger Port Conflict** (Normal when running multiple services):
```
Starting inspector on localhost:9229 failed: address already in use
```

**Initial Kafka Connection Errors** (Resolve automatically during startup):
```
ERROR [Connection] Response Metadata - "There is no leader for this topic-partition"
ERROR [Connection] Response GroupCoordinator - "The group coordinator is not available"
```
These happen while Kafka is electing topic leaders. Within 1-2 seconds, you'll see:
```
INFO [ConsumerGroup] Consumer has joined the group
```

### 🔍 Verifying Everything is Running

**Check API Gateway:**
```bash
curl http://localhost:3000/api
```

**Check Docker containers:**
```bash
docker ps
# Should show: kafka and zookeeper containers
```

**Check Database Connection:**
```bash
npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
# Visual database browser - view and edit data
```

**Check Kafka topics:**
```bash
docker exec -it $(docker ps -q -f name=kafka) kafka-topics.sh --list --bootstrap-server localhost:9092
```

**Check PostgreSQL (local):**
```bash
psql -d kafka_microservices -c "\dt"
# Lists all database tables

# Or check connection status
pg_isready
```

## 🧪 Testing

Run all tests:

```bash
npx nx run-many --target=test --all
```

Run tests for specific service:

```bash
npx nx test api-gateway
npx nx test order-microservice
npx nx test payment-microservice
npx nx test notification-microservice
```

Run tests with coverage:

```bash
npx nx test api-gateway --coverage
```

## 🐛 Troubleshooting

### Nx Plugin Worker Errors

If you encounter errors like "Plugin worker @nx/jest/plugin exited unexpectedly":

```bash
# Step 1: Reset Nx cache
npx nx reset

# Step 2: If that doesn't work, reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npx nx reset
```

**Note**: This project requires Node.js v18.18.0+ or Node 20+. Check your version with `node --version`.

### Kafka Connection Issues

If microservices can't connect to Kafka:

1. Ensure Kafka is running: `docker ps`
2. Check Kafka logs: `docker-compose logs kafka`
3. Verify Kafka is accessible: `telnet localhost 9092`
4. Restart Kafka: `docker-compose restart kafka`

### Port Already in Use

If port 3000 is already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Or change the port in `apps/api-gateway/src/main.ts`.

### Nx Build Errors

Clear Nx cache:

```bash
npx nx reset
```

### Docker Issues

```bash
# Remove all containers and start fresh
docker-compose down -v
docker system prune -f
docker-compose up -d
```

### Services Won't Start in Parallel

If `npm run dev` doesn't work:

```bash
# Try running services individually in separate terminals
npm run dev:gateway
npm run dev:order
npm run dev:payment
npm run dev:notification
```

### Database Connection Issues

If services can't connect to PostgreSQL:

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Or manually
pg_ctl -D /usr/local/var/postgres start

# Test connection manually
psql -d kafka_microservices

# Check PostgreSQL logs (macOS Homebrew)
tail -f /usr/local/var/log/postgres.log
```

**Common connection errors:**
- `Connection refused`: PostgreSQL is not running
- `Database does not exist`: Run `createdb kafka_microservices`
- `Role does not exist`: Update DATABASE_URL in `.env` with correct username

### Prisma Client Not Generated

If you see errors about Prisma Client not being found:

```bash
# Regenerate Prisma Client
npm run prisma:generate

# If that doesn't work, clean and regenerate
rm -rf generated/prisma
npm run prisma:generate
```

### Database Migration Issues

If migrations fail:

```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or push schema without migrations (for development)
npm run db:push
```

### Port Conflicts

**Port 5432 (PostgreSQL) Already in Use:**
```bash
# Find process using port 5432
lsof -i :5432

# If you have multiple PostgreSQL instances, stop the unwanted one
brew services stop postgresql@14  # Example for specific version
```

**Port 3000 (API Gateway) Already in Use:**
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Nx Documentation](https://nx.dev/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Happy Coding! 🚀**
