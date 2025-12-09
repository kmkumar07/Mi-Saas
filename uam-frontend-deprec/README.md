# UAM Frontend - User Access Management Admin UI

Vue.js 3 admin application for managing users, roles, and permissions.

## 🚀 Tech Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development
- **Vue Router** for routing
- **Pinia** for state management
- **Axios** for HTTP requests

## 📁 Project Structure

```
src/
├── components/        # Reusable components
├── views/            # Page components
├── router/           # Vue Router configuration
├── stores/           # Pinia stores
├── services/         # API services
├── composables/      # Vue composables
├── types/            # TypeScript types
├── utils/            # Utility functions
└── assets/           # Static assets
```

## 🛠️ Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

## 📚 Features

- ✅ Authentication with JWT
- ✅ User management
- ✅ Role management
- ✅ Permission management
- ✅ Employee invitations
- ✅ Responsive design

## 🔗 API Integration

The frontend communicates with the UAM backend service running on port 3001.

## 📝 License

MIT
