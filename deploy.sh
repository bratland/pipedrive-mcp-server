#!/bin/bash

# Pipedrive MCP Server - Google Cloud Run Deployment Script

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="pipedrive-mcp-server"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Pipedrive MCP Server - Cloud Run Deployment${NC}"
echo "================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if PROJECT_ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${YELLOW}Enter your Google Cloud Project ID:${NC}"
    read PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}Error: Project ID is required${NC}"
        exit 1
    fi
fi

# Check if PIPEDRIVE_API_TOKEN is set
if [ -z "$PIPEDRIVE_API_TOKEN" ]; then
    echo -e "${YELLOW}Enter your Pipedrive API Token:${NC}"
    read -s PIPEDRIVE_API_TOKEN
    echo
    if [ -z "$PIPEDRIVE_API_TOKEN" ]; then
        echo -e "${RED}Error: Pipedrive API Token is required${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo ""

# Set the project
echo -e "${GREEN}Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${GREEN}Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install
npm install express @types/express

# Build the TypeScript project
echo -e "${GREEN}Building TypeScript project...${NC}"
npm run build

# Configure Docker for Google Container Registry
echo -e "${GREEN}Configuring Docker for GCR...${NC}"
gcloud auth configure-docker

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker build --platform=linux/amd64 -t ${IMAGE_NAME}:latest .

# Push the image to Google Container Registry
echo -e "${GREEN}Pushing image to Google Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --set-env-vars "NODE_ENV=production,PIPEDRIVE_API_TOKEN=${PIPEDRIVE_API_TOKEN}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
    echo ""
    echo "Available endpoints:"
    echo "  ${SERVICE_URL}/health - Health check"
    echo "  ${SERVICE_URL}/api/deals - List deals"
    echo "  ${SERVICE_URL}/api/persons - List persons"
    echo "  ${SERVICE_URL}/api/organizations - List organizations"
    echo "  ${SERVICE_URL}/api/pipelines - List pipelines"
    echo "  ${SERVICE_URL}/api/search?term=keyword - Search across entities"
    echo ""
    echo "To update environment variables later:"
    echo "  gcloud run services update ${SERVICE_NAME} --region ${REGION} --set-env-vars PIPEDRIVE_API_TOKEN=new_token"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi