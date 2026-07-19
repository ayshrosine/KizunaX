# KizunaX - AI-Powered Digital Identity System

Transform your fragmented academic and professional data into a structured, searchable, and intelligent knowledge repository.

![KizunaX](https://img.shields.io/badge/KizunaX-v2.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10+-green.svg)
![React](https://img.shields.io/badge/React-18.0-black.svg)
![Vite](https://img.shields.io/badge/Vite-6.4-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🌟 Features

- **Multi-User Platform**: Each user has their own private workspace with complete data isolation
- **Secure Authentication**: JWT-based authentication with secure password hashing
- **Intelligent Organization**: Automatically categorize documents without manual sorting
- **Smart Retrieval**: Find any document instantly using natural language search
- **Digital Timeline**: Visualize your academic and professional journey over time
- **AI-Powered**: Uses OpenAI GPT-4o-mini and Hugging Face models for intelligent processing
- **Semantic Search**: Vector-based search for finding related content
- **Relationship Engine**: Identifies connections between skills, projects, and experiences
- **Multi-Format Support**: Handles PDF, DOCX, TXT, and images
- **Cloud Integrations**: Deep integration with **Google Drive** and **Notion** to automatically sync external documents directly into your dashboard.
- **User Management**: Registration, login, and profile management

## 🎯 Problem Solved

Every student builds a digital footprint throughout their academic and professional journey. Certificates, resumes, project reports, internship letters, portfolios, GitHub repositories, achievements, and learning records accumulate over time. Yet most of this information remains scattered across folders, emails, cloud drives, and devices.

**KizunaX solves this by:**
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
- **AI/ML**: OpenAI GPT-4o-mini + Hugging Face Transformers
- **Vector Database**: ChromaDB for semantic search
- **Primary Database**: MongoDB with Motor (async driver) and Beanie ODM
- **Media Storage**: Cloudflare R2 (S3-compatible storage)
- **Document Processing**: PyPDF2, python-docx, Tesseract OCR
- **Integrations**: Google APIs, Notion SDK

**Frontend:**
- **Framework**: React 18 with Vite
- **Styling**: Custom Premium Vanilla CSS (Glassmorphism, Dark mode first)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts

### System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React/Vite)                 │
│  Dashboard │ Upload │ Search │ Timeline │ Integrations       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────┴─────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  Upload API │ Search API │ Timeline API │ Document API      │
│               Google Drive & Notion API                     │
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

```text
KizunaX/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration, MongoDB, Security
│   │   ├── models/         # MongoDB (Beanie) document models
│   │   ├── repositories/   # DB query abstraction layer
│   │   ├── services/       # Business logic & AI services
│   │   └── integrations/   # 3rd party integrations (GDrive, Notion)
│   ├── data/               # Application data (uploads, chroma_db)
│   ├── main.py            # Application entry point
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/               # React/Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page layouts
│   │   ├── lib/           # Utilities & API client
│   │   └── styles.css     # Global custom styling
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Vite config
├── specs/                 # Documentation
│   ├── KizunaX_Architecture_and_Data_Flow.md
│   ├── KizunaX_Backend_Detailed_Doc.md
│   ├── KizunaX_Frontend_Detailed_Doc.md
│   ├── KizunaX_GDrive_Notion_Integration_Spec.md
│   └── archive/           # Old specifications
└── README.md              # Project README
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

# Start development server
npm run dev
```
Frontend will start at `http://localhost:5173`

### 4. Access the Application
Open your browser and navigate to `http://localhost:5173`

### 5. Register and Login
1. **Register**: Create a new account
   - Go to `http://localhost:5173/register`
   - Enter your email, username, and password
   - Click "Create Account"
2. **Login**: Sign in to your account
   - Go to `http://localhost:5173/login`
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

### Cloud Integrations (Google Drive & Notion)
1. Go to the Integrations settings page.
2. Authenticate with your Google Drive or Notion account securely.
3. Automatically sync files or pages into KizunaX. They will be processed through the AI pipeline exactly like standard file uploads!

### Searching Documents
1. Go to the Search page
2. Enter natural language queries like:
   - "Show all my certificates"
   - "What AI projects do I have?"
   - "Python machine learning"
3. Use category filters for refined results

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
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ChromaDB Configuration (Local - Default)
CHROMA_DB_PATH=./data/chroma_db

# External API Integrations (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret

UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,txt,png,jpg,jpeg
CORS_ORIGINS=http://localhost:5173
SECRET_KEY=your-secret-key-change-in-production
```

**Important**: Generate a secure SECRET_KEY for production:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive Swagger documentation.

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
- `GET /api/integrations/status` - Check Notion/Drive auth statuses
- `POST /api/integrations/sync` - Trigger a document sync from integrations

*Detailed API documentation is available dynamically via FastAPI /docs route.*

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

## 📝 Documentation
Comprehensive documentation is available in the `specs/` folder:
- **KizunaX_Architecture_and_Data_Flow.md**: System architecture and database models
- **KizunaX_Backend_Detailed_Doc.md**: Backend layer API documentation
- **KizunaX_Frontend_Detailed_Doc.md**: Frontend UI structure and routing
- **KizunaX_GDrive_Notion_Integration_Spec.md**: How integrations interact with the core engine
- **archive/**: Outdated, historical specs

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
- **Backend**: Flake8 linting
- **Frontend**: Prettier

## 🚢 Deployment

### Docker Deployment (Recommended)
```bash
# Build backend
cd backend
docker build -t kizunax-backend .

# Build frontend
cd frontend
docker build -t kizunax-frontend .

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
- No SQL injection (MongoDB/Beanie ODM usage)
- Input validation (Pydantic models)
- Environment variable protection
- Multi-tenant data isolation strictly enforced on the API layer

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
- FastAPI & Beanie ODM for robust backend performance
- React & Vite for lighting fast UI

## 📞 Support
For issues, questions, or contributions:
1. Check the documentation in the `specs/` folder
2. Open an issue on GitHub

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
**Built with ❤️ for the Wooble Challenge**
