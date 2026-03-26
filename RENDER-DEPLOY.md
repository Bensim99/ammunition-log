# Render Deployment Guide for Ammunition Tracker

## Prerequisites
- GitHub account with repository
- Render account (https://render.com)
- MongoDB Atlas account for database (https://www.mongodb.com/cloud/atlas)

## Step 1: Set Up MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account or sign in
3. Create a new project and cluster
4. Get your connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ammunition-log
   ```
5. Save this connection string for later

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Push all changes to GitHub
2. Go to https://dashboard.render.com
3. Click "New +"
4. Select "Web Service"
5. Connect your GitHub repository
6. Render will automatically find `render.yaml` and configure the service
7. Add environment variables:
   - **MONGODB_URI**: Your MongoDB Atlas connection string

### Option B: Manual Render Configuration

1. Go to https://dashboard.render.com
2. Click "New Web Service"
3. Select "Deploy from a Git repository"
4. Connect your GitHub account and select this repository
5. Configuration:
   - **Name**: ammunition-log
   - **Region**: Choose your region
   - **Runtime**: Node
   - **Build Command**: `npm install --prefix client && npm install --prefix server && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: 
     - Add `NODE_ENV=production`
     - Add `MONGODB_URI=` (your MongoDB connection string)

## Step 3: Environment Variables

Add these to your Render service settings:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/ammunition-log?retryWrites=true&w=majority
```

## Step 4: Deploy

1. Render will automatically deploy on push to main branch
2. Your app will be available at: `https://ammunition-log.onrender.com`
3. Check the deployment logs if there are any issues

## Local Development Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally OR MongoDB Atlas connection

### Setup Steps

```bash
# 1. Install root dependencies
npm install

# 2. Create .env file in root
cp .env.example .env
# Edit .env with your MongoDB connection string

# 3. Install server dependencies
cd server && npm install

# 4. Install client dependencies
cd ../client && npm install

# 5. Run development servers
cd .. && npm run dev
```

### For Local MongoDB (Optional)

If you want to use MongoDB locally:

```bash
# On macOS with brew:
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Update .env:
MONGODB_URI=mongodb://localhost:27017/ammunition-log
```

## Project Structure

```
ammunition-log/
├── server/              # Express.js backend
│   ├── server.js
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   └── package.json
├── client/             # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── package.json        # Root package.json
├── render.yaml         # Render deployment config
├── .env.example        # Environment variables template
└── README.md
```

## API Endpoints

### Ammunition Management
- `GET /api/ammunition` - Get all ammunition stocks
- `GET /api/ammunition/:batteryId` - Get ammunition by battery
- `PATCH /api/ammunition/:batteryId/:ammoId` - Update ammunition quantity

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Batteries
- `GET /api/batteries` - Get all batteries
- `GET /api/batteries/:batteryId` - Get battery details

### Health Check
- `GET /api/health` - Server health status

## Troubleshooting

### Build Failures
- Check the Render logs for specific error messages
- Ensure all environment variables are set
- Verify MongoDB connection string is correct

### Database Connection Issues
- Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0 for Render)
- Verify connection string in .env
- Test connection locally first

### Deployment Webhook Issues
- Go to GitHub → Settings → Webhooks
- Verify Render webhook is properly configured
- Force a redeploy from Render dashboard

## Production Tips

1. **Database Indexing**: MongoDB indexes are automatically created by Mongoose
2. **CORS**: By default, CORS is enabled for all origins (update in production)
3. **Environment**: Always set `NODE_ENV=production`
4. **Monitoring**: Check Render dashboard for alerts and metrics

## Support

For issues:
1. Check Render deployment logs
2. Check browser console for frontend errors
3. Verify MongoDB connection
4. Review server logs on Render dashboard
