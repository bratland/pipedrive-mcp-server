#!/bin/bash

# Pipedrive MCP Server - Google Cloud Run Deployment Script (Nordic Region)

# Configuration - Using europe-north1 (Finland) for Nordic deployment
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION="europe-north1"  # Finland - Nordic region
SERVICE_NAME="pipedrive-mcp-server"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌍 Pipedrive MCP Server - Nordic Region Deployment${NC}"
echo -e "${BLUE}Region: europe-north1 (Finland)${NC}"
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
echo "  Region: $REGION (Nordic - Finland)"
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
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository in Nordic region if it doesn't exist
echo -e "${GREEN}Creating Artifact Registry repository in Nordic region...${NC}"
gcloud artifacts repositories create pipedrive-mcp \
    --repository-format=docker \
    --location=europe-north1 \
    --description="Pipedrive MCP Server Docker images" \
    2>/dev/null || echo "Repository already exists"

# Use Artifact Registry instead of Container Registry for Nordic region
AR_IMAGE="europe-north1-docker.pkg.dev/${PROJECT_ID}/pipedrive-mcp/${SERVICE_NAME}"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install
npm install express @types/express

# Build the TypeScript project
echo -e "${GREEN}Building TypeScript project...${NC}"
npm run build

# Configure Docker for Artifact Registry
echo -e "${GREEN}Configuring Docker for Nordic Artifact Registry...${NC}"
gcloud auth configure-docker europe-north1-docker.pkg.dev

# Build the Docker image with linux/amd64 platform
echo -e "${GREEN}Building Docker image for linux/amd64...${NC}"
docker build --platform=linux/amd64 -t ${AR_IMAGE}:latest -t ${AR_IMAGE}:$(date +%Y%m%d-%H%M%S) .

# Push the image to Artifact Registry
echo -e "${GREEN}Pushing image to Nordic Artifact Registry...${NC}"
docker push ${AR_IMAGE}:latest
docker push ${AR_IMAGE}:$(date +%Y%m%d-%H%M%S)

# Deploy to Cloud Run in Nordic region
echo -e "${GREEN}Deploying to Cloud Run in Nordic region (europe-north1)...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${AR_IMAGE}:latest \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --cpu-boost \
    --set-env-vars "NODE_ENV=production,PIPEDRIVE_API_TOKEN=${PIPEDRIVE_API_TOKEN}" \
    --service-account ${SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com 2>/dev/null || \
gcloud run deploy ${SERVICE_NAME} \
    --image ${AR_IMAGE}:latest \
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
    echo -e "${GREEN}✅ Deployment successful to Nordic region!${NC}"
    echo -e "${GREEN}🌍 Region: europe-north1 (Finland)${NC}"
    echo -e "${GREEN}🔗 Service URL: ${SERVICE_URL}${NC}"
    echo ""
    echo -e "${BLUE}Available endpoints:${NC}"
    echo "  ${SERVICE_URL}/health - Health check"
    echo "  ${SERVICE_URL}/ - Server information"
    echo "  ${SERVICE_URL}/mcp - MCP protocol endpoint (POST)"
    echo ""
    echo -e "${YELLOW}To update environment variables later:${NC}"
    echo "  gcloud run services update ${SERVICE_NAME} --region ${REGION} --set-env-vars PIPEDRIVE_API_TOKEN=new_token"
    echo ""
    echo -e "${YELLOW}To view logs:${NC}"
    echo "  gcloud run logs read --service ${SERVICE_NAME} --region ${REGION}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi