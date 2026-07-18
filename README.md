# IdentityVault - AI-Powered Digital Identity System

Transform your fragmented academic and professional data into a structured, searchable, and intelligent knowledge repository.

![IdentityVault](https://img.shields.io/badge/IdentityVault-v2.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🌟 Features

- **Multi-User Platform**: Each user has their own private workspace with complete data isolation
- **Secure Authentication**: JWT-based authentication with secure password hashing
- **Intelligent Organization**: Automatically categorize documents without manual sorting
- **Smart Retrieval**: Find any document instantly using natural language search
- **Digital Timeline**: Visualize your academic and professional journey over time
- **AI-Powered**: Uses OpenAI GPT-4 and Hugging Face models for intelligent processing
- **Semantic Search**: Vector-based search for finding related content
- **Relationship Engine**: Identifies connections between skills, projects, and experiences
- **Multi-Format Support**: Handles PDF, DOCX, TXT, and images
- **User Management**: Registration, login, and profile management

## 🎯 Problem Solved

Every student builds a digital footprint throughout their academic and professional journey. Certificates, resumes, project reports, internship letters, portfolios, GitHub repositories, achievements, and learning records accumulate over time. Yet most of this information remains scattered across folders, emails, cloud drives, and devices.

**IdentityVault solves this by:**
- Providing each user with a private, secure workspace
- Understanding and organizing your documents automatically
- Connecting related information across your digital footprint
- Making your achievements instantly accessible through natural search
- Visualizing your growth and career journey
- Ensuring complete data isolation between users

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **Framework**: FastAPI (Python 3.10+)
- **AI/ML**: OpenAI GPT-4 + Hugging Face Transformers
- **Vector Database**: ChromaDB for semantic search
- **Primary Database**: MongoDB with Motor (async driver) and Beanie ODM
- **Media Storage**: Cloudflare R2 (S3-compatible storage)
- **Document Processing**: PyPDF2, python-docx, Tesseract OCR

**Frontend:**
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  Dashboard │ Upload │ Search │ Timeline                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────┴─────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  Upload API │ Search API │ Timeline API │ Document API      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│              AI/ML Layer (OpenAI + Hugging Face)            │
│  Categorization │ Embeddings │ Relationship Extraction      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Data Layer                               │
│  ChromaDB (Vectors) │ MongoDB (Metadata) │ R2 (Media)      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
KizunaX/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration, MongoDB, Security
│   │   ├── models/         # MongoDB document models
│   │   ├── services/       # Business logic & AI services
│   │   └── utils/          # Utilities (R2 storage, etc.)
│   ├── data/               # Application data
│   │   ├── uploads/        # Temporary upload directory
│   │   └── chroma_db/      # Vector database
│   ├── main.py            # Application entry point
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # Environment variables
│   └── .env.example       # Environment variables template
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   │   ├── page.tsx   # Home page
│   │   │   ├── upload/    # Upload page
│   │   │   ├── search/    # Search page
│   │   │   └── timeline/  # Timeline page
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities & API client
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   ├── tsconfig.json      # TypeScript config
│   ├── tailwind.config.js # Tailwind config
│   └── .env.local         # Frontend environment variables
├── specs/                 # Documentation
│   ├── architecture.md    # System architecture
│   ├── setup.md          # Setup guide
│   ├── api-documentation.md # API reference
│   └── README.md          # This file
└── README.md             # Project README
```

## 🚀 Quick Start

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd KizunaX
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create environment file
# Copy .env.example to .env and add your credentials
cp .env.example .env
# Edit .env with your MongoDB URI, R2 credentials, and OpenAI API key

# Create required directories
mkdir data\uploads
mkdir data\chroma_db

# Start backend server
python main.py
```

Backend will start at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
# .env.local is already created with NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will start at `http://localhost:3000`

### 4. Access the Application

Open your browser and navigate to `http://localhost:3000`

### 5. Register and Login

1. **Register**: Create a new account
   - Go to `http://localhost:3000/register`
   - Enter your email, username, and password
   - Click "Create Account"

2. **Login**: Sign in to your account
   - Go to `http://localhost:3000/login`
   - Enter your email and password
   - Click "Sign In"

3. **Start Using**: Upload documents and explore features
   - Each user has their own private workspace
   - Data is completely isolated between users

## 📖 Usage

### Uploading Documents

1. Navigate to the Upload page
2. Drag and drop files or click to select
3. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG
4. Documents are automatically categorized and processed

### Searching Documents

1. Go to the Search page
2. Enter natural language queries like:
   - "Show all my certificates"
   - "What AI projects do I have?"
   - "Python machine learning"
3. Use category filters for refined results
4. Enable Natural Language Mode for smart query interpretation

### Viewing Timeline

1. Visit the Timeline page
2. See your digital journey organized by year
3. Filter by specific years
4. View event details and connections

## 🔧 Configuration

### Backend Environment Variables (.env)

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

# ChromaDB Configuration (Local - Default)
CHROMA_DB_PATH=./data/chroma_db

# ChromaDB Cloud Configuration (Optional - Uncomment to use)
# CHROMA_HOST=api.trychroma.com
# CHROMA_API_KEY=your_chroma_api_key
# CHROMA_TENANT=your_tenant_id
# CHROMA_DATABASE=KizunaX

UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,txt,png,jpg,jpeg
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-change-in-production
```

**Important**: Generate a secure SECRET_KEY for production:
```bash
# Using OpenSSL
openssl rand -hex 32

# Or use a random string generator
python -c "import secrets; print(secrets.token_hex(32))"
```

**ChromaDB Cloud**: To use ChromaDB cloud instead of local storage, uncomment the CHROMA_* variables and add your credentials. The system will automatically detect and use cloud configuration if provided.

### Frontend Environment Variables (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Protected Endpoints (Require Authentication)

- `POST /api/upload/` - Upload single document
- `POST /api/upload/bulk` - Upload multiple documents
- `GET /api/documents/` - Get user's documents
- `GET /api/documents/{id}` - Get specific document
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/search/` - Semantic search
- `GET /api/search/categories` - Get user's categories
- `GET /api/search/skills` - Get user's skills
- `GET /api/timeline/` - Get user's digital timeline
- `GET /api/timeline/relationships` - Get user's document relationships

Detailed API documentation is available in `specs/api-documentation.md`

## 🧠 AI Features

### Intelligent Categorization

Documents are automatically classified into:
- **Projects**: Code repositories, project reports, portfolios
- **Skills**: Technical and soft skills extracted from documents
- **Certifications**: Certificates, course completions, badges
- **Internships**: Internship letters, work experience
- **Achievements**: Awards, competitions, recognition
- **Academics**: Transcripts, degrees, courses

### Semantic Search

Vector-based search using:
- **Primary**: OpenAI text-embedding-3-small (1536 dimensions)
- **Fallback**: Hugging Face sentence-transformers (384 dimensions)
- **Algorithm**: Cosine similarity in ChromaDB

### Relationship Engine

Identifies connections between:
- Certifications → Skills gained
- Skills → Projects using those skills
- Projects → Internships/Career path
- Academics → Skills → Projects

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📝 Documentation

Comprehensive documentation is available in the `specs/` folder:

- **architecture.md**: System architecture and design decisions
- **setup.md**: Detailed setup and troubleshooting guide
- **api-documentation.md**: Complete API reference
- **implementation-guide.md**: Implementation details and code organization
- **workflow-guide.md**: AI workflows and architecture diagrams

## 🛠️ Development

### Backend Development

```bash
cd backend
venv\Scripts\activate
python main.py
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Code Style

- **Backend**: Black formatting, Flake8 linting
- **Frontend**: ESLint, Prettier

## 🚢 Deployment

### Docker Deployment (Recommended)

```bash
# Build backend
cd backend
docker build -t identityvault-backend .

# Build frontend
cd frontend
docker build -t identityvault-frontend .

# Run with docker-compose
docker-compose up -d
```

### Manual Deployment

**Backend:**
```bash
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 🔒 Security

- File upload validation (size, type, content)
- CORS configuration
- SQL injection prevention (SQLAlchemy ORM)
- Input validation (Pydantic models)
- Environment variable protection

**Note**: For production, implement:
- JWT authentication
- Rate limiting
- HTTPS/TLS
- File malware scanning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for the Wooble Challenge
- Uses OpenAI API for intelligent categorization
- Uses Hugging Face Transformers for local embeddings
- ChromaDB for vector storage
- FastAPI for backend API
- Next.js for frontend framework

## 📞 Support

For issues, questions, or contributions:
1. Check the documentation in the `specs/` folder
2. Review the troubleshooting guide in `specs/setup.md`
3. Open an issue on GitHub

## 🎯 Success Metric

The defining moment of the demo should make a student say:

**"I never have to search through folders again."**

## 🚀 Future Enhancements

- [ ] File versioning and history
- [ ] Export functionality (PDF, JSON)
- [ ] Advanced analytics dashboard
- [ ] Resume generation
- [ ] Portfolio website generation
- [ ] Mobile application (React Native)
- [ ] Cloud sync integration
- [ ] Collaboration features
- [ ] Advanced relationship extraction with AI

---

**Built with ❤️ for the Wooble Challenge**#   K i z u n a X  
 #   K i z u n a X  
 