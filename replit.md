# Overview

This is a grocery store management system built as an admin dashboard. It's a full-stack application that allows store administrators to manage products, inventory, orders, customers, coupons, and store settings. The system features a modern web interface with Material Design principles and provides comprehensive tools for running a grocery store business.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with Material Design color scheme and custom CSS variables
- **State Management**: TanStack React Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Management**: Express session with PostgreSQL session store
- **API Structure**: RESTful API endpoints under `/api` prefix
- **Security**: Password hashing using Node.js crypto (scrypt algorithm)

## Database Schema
The system uses the following main entities:
- **Users**: Admin accounts with role-based access
- **Products**: Store inventory with SKU, barcode, pricing, and stock levels
- **Orders**: Customer orders with items and status tracking
- **Customers**: Customer information and status management
- **Coupons**: Discount codes with usage limits and expiration dates
- **Store Settings**: Configurable store information and preferences

## Key Design Decisions
- **Monorepo Structure**: Client, server, and shared code in one repository
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend
- **Authentication Strategy**: Session-based authentication suitable for admin dashboard use
- **Database Abstraction**: Drizzle ORM provides type-safe queries and migrations
- **Component Architecture**: Atomic design with reusable UI components
- **Material Design**: Consistent visual language with Google Material Design principles

## Development Features
- **Hot Reload**: Vite development server with fast refresh
- **Code Generation**: Drizzle generates TypeScript types from database schema
- **Path Aliases**: Clean imports using @ and @shared aliases
- **Error Handling**: Global error boundaries and API error handling
- **Form Validation**: Client-side validation with Zod schemas

# External Dependencies

## Database Services
- **PostgreSQL**: Primary database using Neon serverless Postgres
- **Database URL**: Configured via environment variable for deployment flexibility

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Google Fonts**: Roboto font family and Material Icons
- **Class Variance Authority**: Component variant management

## Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TSX**: TypeScript execution for development server

## Session and Storage
- **Connect-pg-simple**: PostgreSQL session store for Express sessions
- **Memory Store**: Fallback in-memory session storage for development

## Form and Data Management
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation utilities
- **TanStack React Query**: Powerful data fetching and caching solution

## Authentication
- **Passport.js**: Authentication middleware with local strategy
- **Express Session**: Session management with secure cookie handling
- **Crypto**: Node.js built-in crypto for password hashing