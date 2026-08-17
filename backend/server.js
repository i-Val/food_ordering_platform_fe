import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

// Route imports
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import profileRoutes from './routes/profile.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base route redirection to documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);
app.use('/api', profileRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found. Go to /api-docs to view the documentation.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Choply Backend Server Running!`);
  console.log(` Port: ${PORT}`);
  console.log(` Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`=========================================`);
});
