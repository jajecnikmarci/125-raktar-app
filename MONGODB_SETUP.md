# MongoDB Setup Guide

## Step-by-Step MongoDB Atlas Configuration

### 1. Create Atlas Account and Cluster

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new cluster (Free tier M0 is sufficient for testing)
4. Choose your cloud provider and region
5. Click "Create Cluster"

### 2. Configure Network Access

1. In Atlas, go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. For development, you can add `0.0.0.0/0` (allows all IPs)
   - ⚠️ **For production**, restrict to specific IPs
4. Click **Confirm**

### 3. Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose authentication method: **Password**
4. Set username and password (save these securely)
5. Set role: **Atlas Admin** (or custom role with read/write on `inventory_system`)
6. Click **Add User**

### 4. Create Database and Collections

1. In **Database** tab, click **Browse Collections**
2. Click **Add My Own Data**
3. Database name: `inventory_system`
4. Collection name: `items`
5. Click **Create**
6. Repeat to create `loans` and `users` collections

### 5. Create Indexes

Option A: Using MongoDB Shell
```javascript
// Connect to your cluster using the connection string

use inventory_system

// Items collection indexes
db.items.createIndex({ "name": 1 })
db.items.createIndex({ "status": 1 })
db.items.createIndex({ "tags": 1 })

// Loans collection indexes
db.loans.createIndex({ "itemId": 1 })
db.loans.createIndex({ "userId": 1 })
db.loans.createIndex({ "status": 1 })
db.loans.createIndex({ "requestedAt": -1 })

// Users collection indexes
db.users.createIndex({ "uid": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
```

Option B: Using MongoDB Compass
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string
3. Navigate to each collection
4. Click **Indexes** tab
5. Click **Create Index**
6. Add indexes as specified above

### 6. Enable MongoDB Data API

1. In Atlas, click **App Services** (left sidebar)
2. Click **Create a New App**
3. Name your app (e.g., "inventory-app")
4. Link your cluster
5. Click **Create App**

#### Configure Data API

1. In your App Services app, go to **HTTPS Endpoints** → **Data API**
2. Click **Enable Data API**
3. Note the **Data API URL** (looks like: `https://data.mongodb-api.com/app/[app-id]/endpoint/data/v1`)

#### Create API Key

1. Go to **App Settings** → **API Keys**
2. Click **Create API Key**
3. Name: "Web App Key"
4. Save the generated key securely (you won't see it again)

#### Configure Data API Access Rules

1. Go to **Rules**
2. Select `inventory_system` database
3. For each collection (`items`, `loans`, `users`):
   - Click on the collection
   - Set permissions as needed
   - For simplicity during development, you can allow all operations
   - ⚠️ **For production**, set strict rules

Example rule for `items` (development):
```json
{
  "database": "inventory_system",
  "collection": "items",
  "roles": [
    {
      "name": "default",
      "apply_when": {},
      "insert": true,
      "delete": true,
      "search": true,
      "read": true,
      "write": true
    }
  ]
}
```

### 7. Get Your Configuration Values

You now have all the values needed for `.env`:

- **VITE_MONGODB_DATA_API_URL**: From Data API settings
- **VITE_MONGODB_API_KEY**: The API key you created
- **VITE_MONGODB_CLUSTER_NAME**: Your cluster name (e.g., "Cluster0")
- **VITE_MONGODB_DATABASE_NAME**: `inventory_system`

### 8. Test Connection

1. Update your `.env` file with the values
2. Run `npm run dev`
3. Try signing in and check browser console for any errors

## Production Considerations

### Security Best Practices

1. **IP Whitelisting**: Remove `0.0.0.0/0` and add only your production domains
2. **API Key Restrictions**: Create separate keys for dev/prod with minimal permissions
3. **Data API Rules**: Implement strict validation rules
4. **Rate Limiting**: Enable in Atlas App Services
5. **Monitoring**: Set up alerts for unusual activity

### Example Production Rules

For `users` collection (only allow reading own user):
```json
{
  "database": "inventory_system",
  "collection": "users",
  "roles": [
    {
      "name": "readOwn",
      "apply_when": {
        "uid": "%%user.id"
      },
      "read": true,
      "write": false
    }
  ]
}
```

### Using MongoDB Realm Functions

For sensitive operations (like approving loans), create serverless functions:

```javascript
// Example: approveLoan function
exports = async function(loanId, adminId) {
  const mongodb = context.services.get("mongodb-atlas");
  const loans = mongodb.db("inventory_system").collection("loans");
  const items = mongodb.db("inventory_system").collection("items");
  
  // Verify admin role
  const users = mongodb.db("inventory_system").collection("users");
  const admin = await users.findOne({ uid: adminId });
  
  if (!admin || admin.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  
  // Approve loan
  const result = await loans.updateOne(
    { _id: BSON.ObjectId(loanId) },
    { 
      $set: { 
        status: "approved",
        approvedAt: new Date(),
        approvedBy: adminId
      }
    }
  );
  
  return result;
};
```

## Troubleshooting

### Common Issues

**Issue**: "Network Error" when making API calls
- **Solution**: Check Network Access settings, ensure IP is whitelisted

**Issue**: "Authentication failed"
- **Solution**: Verify API key is correct and hasn't expired

**Issue**: "Collection not found"
- **Solution**: Ensure database and collection names match exactly (case-sensitive)

**Issue**: "Permission denied"
- **Solution**: Check Data API rules, ensure appropriate permissions are set

### Testing MongoDB Connection

Use this test script to verify connection:

```typescript
// test-mongo.ts
import { MongoDBService } from './src/services/mongodb.service';

async function testConnection() {
  const service = MongoDBService.getInstance();
  try {
    const items = await service.getItems();
    console.log('✅ MongoDB connection successful!');
    console.log('Items found:', items.length);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
}

testConnection();
```

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Data API Documentation](https://www.mongodb.com/docs/atlas/app-services/data-api/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [Atlas App Services](https://www.mongodb.com/docs/atlas/app-services/)
