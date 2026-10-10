import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NutriDeliver API",
      version: "1.0.0",
      description: `
        NutriDeliver is a comprehensive healthy food delivery platform with four distinct user roles:
        - Users/Customers**: Browse, order, and track healthy food
        - Restaurants**: Manage menu, orders, and analytics
        - Delivery Riders**: Handle order delivery and tracking
        - Super Admin**: Platform management and analytics
      `,
      contact: {
        name: "NutriDeliver Team",
        email: "support@nutrideliver.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8000/api",
        description: "Development server",
      },
      {
        url: "https://api.nutrideliver.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error description" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success description" },
            data: { type: "object" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["user", "restaurant", "rider", "admin"],
            },
            profile: {
              type: "object",
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                phone: { type: "string" },
                avatar: { type: "string" },
                dateOfBirth: { type: "string", format: "date" },
              },
            },
            preferences: {
              type: "object",
              properties: {
                dietaryRestrictions: {
                  type: "array",
                  items: { type: "string" },
                },
                allergies: { type: "array", items: { type: "string" } },
                calorieGoal: { type: "number" },
              },
            },
            isActive: { type: "boolean" },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Restaurant: {
          type: "object",
          properties: {
            _id: { type: "string" },
            ownerId: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            cuisineType: {
              type: "string",
              enum: [
                "healthy",
                "salads",
                "protein",
                "vegan",
                "vegetarian",
                "gluten-free",
                "keto",
                "mediterranean",
                "smoothies",
              ],
            },
            contact: {
              type: "object",
              properties: {
                email: { type: "string" },
                phone: { type: "string" },
                address: {
                  type: "object",
                  properties: {
                    street: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    zipCode: { type: "string" },
                    coordinates: {
                      type: "object",
                      properties: {
                        lat: { type: "number" },
                        lng: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
            operatingHours: {
              type: "object",
              properties: {
                opening: { type: "string" },
                closing: { type: "string" },
                days: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ],
                  },
                },
              },
            },
            deliverySettings: {
              type: "object",
              properties: {
                deliveryFee: { type: "number", default: 2.99 },
                minOrderAmount: { type: "number", default: 15 },
                deliveryRadius: { type: "number", default: 10 },
                estimatedDeliveryTime: { type: "number", default: 30 },
              },
            },
            rating: { type: "number", minimum: 0, maximum: 5, default: 0 },
            totalReviews: { type: "number", default: 0 },
            images: { type: "array", items: { type: "string" } },
            isActive: { type: "boolean", default: true },
            isVerified: { type: "boolean", default: false },
            isOpen: { type: "boolean", default: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        FoodItem: {
          type: "object",
          properties: {
            _id: { type: "string" },
            restaurantId: { type: "string" },
            categoryId: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            ingredients: { type: "array", items: { type: "string" } },
            dietaryTags: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "vegan",
                  "vegetarian",
                  "gluten-free",
                  "dairy-free",
                  "nut-free",
                  "low-carb",
                  "high-protein",
                  "keto",
                  "paleo",
                  "sugar-free",
                  "organic",
                  "non-gmo",
                ],
              },
            },
            preparationTime: { type: "number" },
            images: { type: "array", items: { type: "string" } },
            isAvailable: { type: "boolean", default: true },
            totalOrders: { type: "number", default: 0 },
            rating: { type: "number", default: 0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderId: { type: "string" },
            userId: { type: "string" },
            restaurantId: { type: "string" },
            riderId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  foodItemId: { type: "string" },
                  name: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                  specialInstructions: { type: "string" },
                  customization: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        option: { type: "string" },
                        choice: { type: "string" },
                        price: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
            orderTotal: { type: "number" },
            deliveryFee: { type: "number" },
            tax: { type: "number" },
            grandTotal: { type: "number" },
            deliveryAddress: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["home", "work", "other"] },
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zipCode: { type: "string" },
                coordinates: {
                  type: "object",
                  properties: {
                    lat: { type: "number" },
                    lng: { type: "number" },
                  },
                },
              },
            },
            status: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "preparing",
                "ready_for_pickup",
                "pickedup",
                "out_for_delivery",
                "delivered",
                "cancelled",
              ],
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
            paymentMethod: {
              type: "string",
              enum: ["card", "cash", "digital_wallet"],
            },
            estimatedDelivery: { type: "string", format: "date-time" },
            preparationTime: { type: "number" },
            rating: { type: "number", minimum: 1, maximum: 5 },
            review: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            image: { type: "string" },
            isActive: { type: "boolean", default: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            restaurantId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  foodItemId: { type: "string" },
                  quantity: { type: "number" },
                  specialInstructions: { type: "string" },
                  price: { type: "number" },
                },
              },
            },
            totalAmount: { type: "number" },
            appliedOffer: {
              type: "object",
              properties: {
                offerId: { type: "string" },
                code: { type: "string" },
                discountAmount: { type: "number" },
              },
            },
          },
        },
        Offer: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            discountType: { type: "string", enum: ["percentage", "fixed"] },
            discountValue: { type: "number" },
            minOrderAmount: { type: "number" },
            maxDiscount: { type: "number" },
            validFrom: { type: "string", format: "date-time" },
            validUntil: { type: "string", format: "date-time" },
            applicableCategories: { type: "array", items: { type: "string" } },
            applicableRestaurants: { type: "array", items: { type: "string" } },
            usageLimit: { type: "number" },
            usedCount: { type: "number" },
            isActive: { type: "boolean", default: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            type: {
              type: "string",
              enum: ["order", "payment", "promotion", "system", "delivery"],
            },
            isRead: { type: "boolean", default: false },
            relatedData: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            current: { type: "number" },
            pages: { type: "number" },
            total: { type: "number" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization",
      },
      { name: "Users", description: "User profile and preferences management" },
      {
        name: "Restaurants",
        description: "Restaurant management and operations",
      },
      { name: "Food", description: "Food items and categories" },
      { name: "Cart", description: "Shopping cart operations" },
      { name: "Orders", description: "Order management and delivery tracking" },
      { name: "Payments", description: "Payment processing and history" },
      { name: "Offers", description: "Promotions and discount codes" },
      { name: "Notifications", description: "User notifications" },
      { name: "Riders", description: "Delivery rider operations" },
      { name: "Admin", description: "Admin panel and platform management" },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };
