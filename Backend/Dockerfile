# Use the prebuilt backend prerequisites image
FROM jasminegraph/jasminegraph-ui-backend-prerequisites:latest

WORKDIR /app

# Copy only the source code (not package.json again)
COPY . .

# Run the app
CMD ["npm", "start"]
