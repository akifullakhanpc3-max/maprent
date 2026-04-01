# MapRent - Rental Marketplace

A production-ready full-stack web application for property rentals with map-first discovery, real-time navigation, booking system, and role-based access (Tenant, Owner, Admin).

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Zustand, React Router, React Leaflet
- **Backend**: Node.js + Express, MongoDB (Mongoose), JWT, Multer
- **Map**: React Leaflet with OpenRouteService for directions

## Quick Start
1. Backend: `cd backend && npm install && npm run dev`
2. Frontend: `cd frontend && npm install && npm run dev`
3. MongoDB: Use MongoDB Atlas or local with 2dsphere indexes
4. Set env vars: `MONGO_URI`, `JWT_SECRET`, `OPENROUTER_API_KEY`

## Roles
- **User (Tenant)**: Browse, book properties
- **Owner**: List properties, manage bookings
- **Admin**: Approve listings, manage users

## API Docs
See backend/docs/api.md

