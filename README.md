# MyShopping Center

A full-stack e-commerce platform for shopping, events, and more.  
Built with a React frontend and a Node.js/Express backend.

---

click the below link to access the system
https://ecommerceweb-gilt.vercel.app/



## Features


- **User Authentication** (register, login, protected/admin routes)
- **Product Catalog** with detailed product pages
- **Shopping Cart** and **Checkout** with Stripe payment integration
- **Order Management** for users and admins
- **Event Listings** and live event features
- **Testimonials** and service rating system
- **Admin Dashboard** for managing products, orders, users, events, and analytics
- **Social & Contact Links** (WhatsApp, Facebook, Twitter, Email, Phone)
- **Responsive UI** with Tailwind CSS
- **Image Uploads** for products, events, and user profiles


---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Axios, Vite
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Payments:** Stripe
- **Authentication:** JWT, Google OAuth
- **Other:** Nginx (for deployment), GitHub Actions (optional for CI/CD)

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or cloud)
- [Stripe account](https://dashboard.stripe.com/register) for payments

### 1. Clone the repository


```sh
git clone https://github.com/Daninc24/myshoppingcenter.git
cd myshoppingcenter
```

### 2. Setup the Backend

```sh
cd backend
cp .env.example .env   # Create your .env file and fill in the required values
npm install
npm start              # or: npm run dev
```

**.env Example:**
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Setup the Frontend

```sh
cd ../frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173) (default Vite port).

---

## Project Structure

```
myshoppingcenter/
  backend/      # Express API, models, controllers, routes, uploads
  frontend/     # React app, components, pages, contexts, assets
  nginx-1.29.0/ # Nginx config (for deployment)
```

---

## Scripts

### Backend

- `npm start` — Start the server
- `npm run dev` — Start with nodemon (dev mode)
- `npm run seed` — Seed the database

### Frontend

- `npm run dev` — Start the React app (Vite)
- `npm run build` — Build for production

---

## Deployment

- **Nginx** is included for reverse proxy and static file serving.
- Configure your environment variables in production.
- Use a process manager like **PM2** for backend.

---

## Security

- **Never commit your `.env` files or secrets.**
- If secrets are accidentally committed, follow [GitHub’s guide to removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) and rotate your credentials.

---

## License

This project is licensed under the MIT License.

---

## Contact

- Email: [info@myshoppingcenter.com](mailto:info@myshoppingcenter.com)
- WhatsApp: [Chat on WhatsApp](https://wa.me/254791991154)
- Facebook: [facebook.com/myshoppingcenter](https://facebook.com/myshoppingcenter)
- Twitter: [twitter.com/myshoppingcenter](https://twitter.com/myshoppingcenter)

---

## Acknowledgements

- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
