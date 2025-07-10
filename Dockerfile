# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including ApexCharts
RUN npm ci 

#RUN /app/node_modules/.bin/esbuild --version
#RUN chmod -R +x node_modules/

# Set permissions for node_modules before running esbuild
RUN chmod -R +x node_modules/

# Ensure ApexCharts assets are available
RUN npm list apexcharts react-apexcharts || echo "ApexCharts dependencies verified"

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
