# Frontend Documentation

## React Web Application for Sustainability Simulator

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment** (Optional)
   - Create `.env` file
   - Add: `REACT_APP_API_URL=http://localhost:5000/api`

3. **Start Development Server**
   ```bash
   npm start
   ```

Application will open on `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Project Structure

- **components/**: Reusable React components
  - Charts.js: Visualization components
  - SimulationForm.js: Input form component

- **pages/**: Page-level components
  - Home.js: Landing page
  - Login.js: Authentication
  - Register.js: Account creation
  - Dashboard.js: Main application interface

- **context/**: React Context
  - AuthContext.js: Authentication state management

- **styles/**: CSS stylesheets with responsive design

- **api.js**: Axios API client with interceptors

### Key Features

- Responsive design for all screen sizes
- Real-time chart updates
- Secure JWT token handling
- Protected routes for authenticated users
- Professional UI with sustainability theme

### Technologies

- React 18
- Recharts for data visualization
- React Router for navigation
- Axios for HTTP requests
- CSS3 for styling

### Development

- Use `npm test` for testing
- Follow React best practices
- Component-based architecture
- Context API for state management

### Deployment

Can be deployed on:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service
