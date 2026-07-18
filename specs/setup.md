# IdentityVault - Setup Guide

## Prerequisites

### Required Software
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: For version control

### Optional but Recommended
- **Docker**: For containerized deployment
- **Postman**: For API testing
- **VS Code**: With Python and React extensions

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd KizunaX
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

#### Create Environment File
Copy `.env.example` to `.env` and add your credentials:
```bash
cp .env.example .env
```

Edit `.env` file in `backend/` directory with your credentials:
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/
MONGODB_DATABASE_NAME=identityvault

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=your_r2_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2

# ChromaDB Configuration
CHROMA_DB_PATH=./data/chroma_db

# Application Configuration
UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,txt,png,jpg,jpeg
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-change-in-production
```

#### Create Required Directories
```bash
mkdir data\uploads
mkdir data\chroma_db
```

#### Test MongoDB Connection
```bash
python -c "from app.core.mongodb import init_mongodb; import asyncio; asyncio.run(init_mongodb())"
```

#### Test Backend
```bash
python main.py
```
Backend should start at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Create Environment File
Create `.env.local` file in `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Initialize shadcn/ui Components
```bash
npx shadcn-ui@latest init
```
Select default options when prompted.

#### Install Required shadcn/ui Components
```bash
npx shadcn-ui@latest add button card input label textarea select badge tabs dialog dropdown-menu
```

#### Test Frontend
```bash
npm run dev
```
Frontend should start at `http://localhost:3000`

## OpenAI API Setup

### 1. Get API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create new API key
5. Copy the key (starts with `sk-`)

### 2. Add to Environment
Add the API key to your `backend/.env` file:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Test API Connection
```bash
cd backend
python -c "from app.services.ai_service import test_openai_connection; test_openai_connection()"
```

## Hugging Face Setup (Optional)

The system uses Hugging Face models for local inference. Models are downloaded automatically on first use.

### Manual Model Download (Optional)
```bash
cd backend
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"
```

## Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
```
Expected response: `{"status": "healthy"}`

### 2. API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

### 3. Frontend Access
Visit `http://localhost:3000` in your browser.

### 4. Test File Upload
1. Go to `http://localhost:3000/upload`
2. Upload a test document (PDF, DOCX, or TXT)
3. Check if it appears in the dashboard

## Troubleshooting

### Backend Issues

**Issue**: Python module not found
```bash
Solution: Ensure virtual environment is activated and dependencies installed
pip install -r requirements.txt
```

**Issue**: OpenAI API error
```bash
Solution: Verify API key is correct and has credits
Check OPENAI_API_KEY in .env file
```

**Issue**: MongoDB connection error
```bash
Solution: Verify MongoDB URI is correct and has proper credentials
Check MONGODB_URI in .env file
```

**Issue**: R2 connection error
```bash
Solution: Verify R2 credentials and bucket name
Check R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY in .env file
```

**Issue**: Port already in use
```bash
Solution: Change port in main.py or stop the conflicting process
# On Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend Issues

**Issue**: npm install fails
```bash
Solution: Clear npm cache and retry
npm cache clean --force
npm install
```

**Issue**: Next.js build error
```bash
Solution: Delete node_modules and .next, then reinstall
rm -rf node_modules .next
npm install
npm run dev
```

**Issue**: API connection refused
```bash
Solution: Ensure backend is running and CORS is configured
Check NEXT_PUBLIC_API_URL in .env.local
Check CORS_ORIGINS in backend .env
```

### File Upload Issues

**Issue**: File size limit exceeded
```bash
Solution: Increase MAX_FILE_SIZE in backend .env
MAX_FILE_SIZE=52428800  # 50MB
```

**Issue**: Unsupported file type
```bash
Solution: Add extension to ALLOWED_EXTENSIONS in backend .env
ALLOWED_EXTENSIONS=pdf,docx,txt,png,jpg,jpeg,mp4,pdf
```

**Issue**: Text extraction fails
```bash
Solution: Ensure system has required dependencies
# For PDF processing
pip install pypdf PyPDF2
# For DOCX processing
pip install python-docx
# For image text extraction
pip install pytesseract Pillow
# Note: Tesseract OCR needs to be installed separately on system
```

## Development Workflow

### 1. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Code Structure
- Backend changes auto-reload with FastAPI
- Frontend changes hot-reload with Next.js
- Database changes require manual migration

### 3. Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### 4. Linting
```bash
# Backend linting
cd backend
black app/
flake8 app/

# Frontend linting
cd frontend
npm run lint
npm run format
```

## Production Deployment

### Docker Deployment

#### Build Docker Images
```bash
# Backend
cd backend
docker build -t identityvault-backend .

# Frontend
cd frontend
docker build -t identityvault-frontend .
```

#### Run with Docker Compose
```bash
docker-compose up -d
```

### Manual Production Setup

#### Backend
```bash
cd backend
# Use production server
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| OPENAI_API_KEY | OpenAI API key | - | Yes |
| OPENAI_MODEL | OpenAI model for categorization | gpt-4 | No |
| OPENAI_EMBEDDING_MODEL | OpenAI embedding model | text-embedding-3-small | No |
| HUGGINGFACE_MODEL | Local HF model | all-MiniLM-L6-v2 | No |
| CHROMA_DB_PATH | ChromaDB storage path | ./data/chroma_db | No |
| SQLITE_DB_PATH | SQLite database path | ./data/metadata.db | No |
| UPLOAD_DIR | File upload directory | ./data/uploads | No |
| MAX_FILE_SIZE | Max file size in bytes | 10485760 | No |
| ALLOWED_EXTENSIONS | Allowed file extensions | pdf,docx,txt,png,jpg,jpeg | No |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000 | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:8000 | Yes |

## Performance Tuning

### Backend Optimization
```env
# Increase workers for production
WORKERS=4

# Enable response compression
ENABLE_COMPRESSION=true

# Cache settings
EMBEDDING_CACHE_SIZE=1000
SEARCH_CACHE_TTL=300
```

### Frontend Optimization
```env
# Enable production optimizations
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
```

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use strong API keys** - Rotate regularly
3. **Enable HTTPS** - In production
4. **Implement rate limiting** - Prevent abuse
5. **Validate all inputs** - Prevent injection attacks
6. **Keep dependencies updated** - `pip update` and `npm update`

## Backup and Recovery

### Database Backup
```bash
# SQLite backup
cp backend/data/metadata.db backend/data/metadata.db.backup

# ChromaDB backup
cp -r backend/data/chroma_db backend/data/chroma_db.backup
```

### File Storage Backup
```bash
# Backup uploaded files
cp -r backend/data/uploads backend/data/uploads.backup
```

### Automated Backup Script
Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"
mkdir -p $BACKUP_DIR
cp backend/data/metadata.db $BACKUP_DIR/
cp -r backend/data/chroma_db $BACKUP_DIR/
cp -r backend/data/uploads $BACKUP_DIR/
echo "Backup completed: $BACKUP_DIR"
```

## Monitoring Setup

### Application Monitoring
```bash
# Install monitoring dependencies
pip install prometheus-fastapi-instrumentator
```

### Logging Configuration
```python
# In backend/app/core/config.py
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s - %(name)s - %(message)s",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "": {"handlers": ["default"], "level": "INFO"},
    },
}
```

## Next Steps

After setup is complete:
1. Upload sample documents to test the system
2. Verify categorization works correctly
3. Test semantic search functionality
4. Check timeline generation
5. Explore the API documentation at `/docs`
6. Review the architecture documentation in `specs/architecture.md`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at `http://localhost:8000/docs`
3. Check logs in backend terminal
4. Review architecture documentation for implementation details