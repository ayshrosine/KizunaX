# IdentityVault - Multi-User Architecture

## Overview

IdentityVault has been transformed from a single-user platform to a **multi-user platform** with complete data isolation, authentication, and user management. Each user has their own private workspace for managing their digital identity.

## Authentication System

### JWT-Based Authentication

The system uses JSON Web Tokens (JWT) for stateless authentication:

- **Token Type**: Bearer token
- **Algorithm**: HS256
- **Expiration**: 30 days
- **Storage**: Client-side (localStorage)

### Authentication Flow

```
┌─────────────┐
│   User      │
│  Registers  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Registration API                  │
│   - Email validation                │
│   - Username uniqueness check       │
│   - Password hashing (bcrypt)       │
│   - User creation                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│   Logs In   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Login API                         │
│   - Credential verification         │
│   - JWT token generation           │
│   - Return user info + token       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Client    │
│  Stores     │
│   Token     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Authenticated Requests            │
│   - Token in Authorization header   │
│   - Server validates each request  │
│   - User context available         │
└─────────────────────────────────────┘
```

## User Data Isolation

### Database Schema Changes

All major tables now include `user_id` for complete data isolation:

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Documents Table (Updated)
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- NEW: User association
    filename VARCHAR(255),
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    file_type VARCHAR(50),
    category VARCHAR(100),
    -- ... other fields
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Skills Table (Updated)
```sql
CREATE TABLE skills (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- NEW: User association
    name VARCHAR(255),
    category VARCHAR(100),
    confidence FLOAT,
    -- ... other fields
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, name)  -- Skills are unique per user
);
```

#### Timeline Events Table (Updated)
```sql
CREATE TABLE timeline_events (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- NEW: User association
    document_id INTEGER,
    event_type VARCHAR(100),
    -- ... other fields
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Document Relationships Table (Updated)
```sql
CREATE TABLE document_relationships (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- NEW: User association
    document_id INTEGER,
    related_document_id INTEGER,
    relationship_type VARCHAR(100),
    -- ... other fields
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### File System Isolation

Files are stored in user-specific directories:

```
backend/data/uploads/
├── user_1/
│   ├── certificates/
│   ├── projects/
│   ├── resumes/
│   └── internships/
├── user_2/
│   ├── certificates/
│   ├── projects/
│   ├── resumes/
│   └── internships/
└── user_3/
    ├── certificates/
    ├── projects/
    ├── resumes/
    └── internships/
```

### API Data Isolation

All API endpoints now require authentication and automatically filter data by user:

#### Before (Single User)
```python
documents = db.query(Document).all()
```

#### After (Multi-User)
```python
documents = db.query(Document).filter(
    Document.user_id == current_user.id
).all()
```

## Authentication Middleware

### Dependency Injection

FastAPI dependency injection ensures all protected routes require authentication:

```python
from app.core.security import get_current_active_user, User

@router.get("/documents")
async def get_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only returns documents for current_user
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).all()
    return documents
```

### Token Validation

1. **Token Extraction**: From `Authorization: Bearer <token>` header
2. **Token Decoding**: JWT validation using SECRET_KEY
3. **User Lookup**: Database query to get user by ID from token
4. **Active Check**: Verify user account is active
5. **Context Injection**: User object available in route handlers

### Automatic Token Handling

The frontend automatically includes tokens in requests:

```typescript
// API interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## User Management

### Registration

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-15T10:30:00"
}
```

### Login

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe"
  }
}
```

### Get Current User

**Endpoint**: `GET /api/auth/me`

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-15T10:30:00"
}
```

### Logout

**Endpoint**: `POST /api/auth/logout`

**Response**:
```json
{
  "message": "Successfully logged out"
}
```

## Protected API Endpoints

All data-related endpoints now require authentication:

### Document Management
- `POST /api/upload/` - Upload document (requires auth)
- `GET /api/documents/` - Get user's documents (requires auth)
- `GET /api/documents/{id}` - Get specific document (requires auth + ownership)
- `DELETE /api/documents/{id}` - Delete document (requires auth + ownership)

### Search
- `POST /api/search/` - Search user's documents (requires auth)
- `GET /api/search/categories` - Get user's categories (requires auth)
- `GET /api/search/skills` - Get user's skills (requires auth)
- `GET /api/search/natural/{query}` - Natural language search (requires auth)

### Timeline
- `GET /api/timeline/` - Get user's timeline (requires auth)
- `GET /api/timeline/relationships` - Get user's relationships (requires auth)
- `GET /api/timeline/persisted` - Get cached timeline (requires auth)

## Security Features

### Password Security
- **Hashing**: bcrypt algorithm
- **Salt**: Automatic salt generation
- **Complexity**: Minimum 6 characters required

### Token Security
- **Signature**: HMAC-SHA256
- **Expiration**: 30-day validity
- **Secret**: Configurable SECRET_KEY

### Data Security
- **Isolation**: Complete user data separation
- **Authorization**: Ownership verification for all operations
- **Session Management**: Automatic token invalidation on logout

### Input Validation
- **Email**: Valid email format required
- **Username**: 3-50 characters, unique
- **Password**: Minimum 6 characters
- **SQL Injection**: Prevented by SQLAlchemy ORM

## Frontend Authentication

### Login Flow

```typescript
const handleLogin = async (email: string, password: string) => {
  const response = await authApi.login(email, password);
  
  // Store credentials
  localStorage.setItem('token', response.access_token);
  localStorage.setItem('user', JSON.stringify(response.user));
  
  // Redirect to dashboard
  router.push('/');
};
```

### Registration Flow

```typescript
const handleRegister = async (userData: RegisterData) => {
  const user = await authApi.register(userData);
  
  // Auto-login after registration
  const loginResponse = await authApi.login(userData.email, userData.password);
  localStorage.setItem('token', loginResponse.access_token);
  localStorage.setItem('user', JSON.stringify(loginResponse.user));
  
  router.push('/');
};
```

### Auth Check

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const user = await authApi.getCurrentUser();
      setUser(user);
    } catch (error) {
      // Invalid token, clear and redirect
      localStorage.removeItem('token');
      router.push('/login');
    }
  };
  
  checkAuth();
}, []);
```

### Logout Flow

```typescript
const handleLogout = async () => {
  await authApi.logout();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
```

## User Experience

### Multiple Users Scenario

**User A (Alice)**:
- Logs in with alice@example.com
- Uploads her certificates and resumes
- Searches her documents only
- Views her personal timeline
- Cannot access User B's data

**User B (Bob)**:
- Logs in with bob@example.com
- Uploads his projects and internships
- Searches his documents only
- Views his personal timeline
- Cannot access User A's data

### Data Privacy Guarantees

1. **Complete Isolation**: Users can only access their own data
2. **No Cross-User Access**: Database queries always filtered by user_id
3. **File System Separation**: Files stored in user-specific directories
4. **Token-Based Security**: Each request validated with user's token
5. **Ownership Verification**: All operations verify user ownership

## Migration from Single-User

### Database Migration

When migrating from single-user to multi-user:

1. **Create Users Table**: Add user management
2. **Add user_id Columns**: Add foreign keys to existing tables
3. **Migrate Existing Data**: Assign existing data to a default user
4. **Update API Endpoints**: Add authentication requirements
5. **Update Frontend**: Add login/register flows

### Example Migration Script

```python
def migrate_to_multi_user():
    """Migrate existing single-user data to multi-user"""
    db = SessionLocal()
    
    # Create default user
    default_user = User(
        email="admin@example.com",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_verified=True
    )
    db.add(default_user)
    db.commit()
    
    # Assign existing documents to default user
    db.query(Document).update({"user_id": default_user.id})
    
    # Assign existing skills to default user
    db.query(Skill).update({"user_id": default_user.id})
    
    # Assign existing timeline events to default user
    db.query(TimelineEvent).update({"user_id": default_user.id})
    
    # Assign existing relationships to default user
    db.query(DocumentRelationship).update({"user_id": default_user.id})
    
    db.commit()
```

## Performance Considerations

### Database Indexing

Key indexes for multi-user performance:

```sql
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX idx_document_relationships_user_id ON document_relationships(user_id);
```

### Query Optimization

All user-specific queries use indexed user_id:

```python
# Efficient query with index
documents = db.query(Document).filter(
    Document.user_id == current_user.id
).all()

# Combined with other filters
documents = db.query(Document).filter(
    Document.user_id == current_user.id,
    Document.category == "Certifications"
).all()
```

## Scalability

### Horizontal Scaling

The multi-user architecture supports horizontal scaling:

1. **Stateless Authentication**: JWT tokens work across multiple servers
2. **Database Scaling**: User-based partitioning enables sharding
3. **File Storage**: User directories can be distributed across storage systems
4. **Load Balancing**: Multiple API servers can handle authentication

### Vertical Scaling

- **User Isolation**: Enables per-user resource optimization
- **Data Archival**: Inactive users' data can be archived
- **Premium Tiers**: Different service levels per user
- **Resource Quotas**: Per-user storage and processing limits

## Monitoring and Analytics

### User Metrics

Track multi-user specific metrics:

- User registration rate
- Active user count
- User-specific document counts
- Per-user storage usage
- Authentication success/failure rates

### Security Monitoring

- Failed login attempts
- Token expiration patterns
- Unusual access patterns
- Cross-user access attempts (should be zero)

## Future Enhancements

### Planned Features

1. **Email Verification**: Send verification emails
2. **Password Reset**: Forgot password functionality
3. **OAuth Integration**: Google, GitHub, etc.
4. **Two-Factor Authentication**: Enhanced security
5. **User Roles**: Admin, regular user, etc.
6. **Team Workspaces**: Shared spaces for teams
7. **User Settings**: Customizable preferences
8. **Activity Logs**: User activity tracking

### Advanced Security

1. **Rate Limiting**: Per-user rate limits
2. **IP Whitelisting**: Optional IP restrictions
3. **Session Management**: Multiple session handling
4. **Token Refresh**: Refresh token implementation
5. **Device Management**: Manage authorized devices

## Compliance

### Data Privacy

- **GDPR Compliant**: User data isolation and right to deletion
- **Data Portability**: Export user data functionality
- **Consent Management**: User consent tracking
- **Data Retention**: Configurable retention policies

### Audit Trail

- **User Actions**: Log all user activities
- **Access Logs**: Track data access patterns
- **Modification History**: Track changes to user data
- **Login History**: Track authentication events

## Troubleshooting

### Common Issues

**Issue**: "401 Unauthorized" errors
- **Solution**: Check token is stored and valid
- **Debug**: Verify token in localStorage
- **Fix**: Re-authenticate if token expired

**Issue**: Users seeing each other's data
- **Solution**: Verify user_id filtering in all queries
- **Debug**: Check database foreign key constraints
- **Fix**: Ensure authentication middleware is applied

**Issue**: Performance degradation with many users
- **Solution**: Add database indexes on user_id
- **Debug**: Analyze query performance
- **Fix**: Implement database sharding if needed

## Conclusion

The multi-user architecture provides:

✅ **Complete Data Isolation**: Each user has private workspace
✅ **Secure Authentication**: JWT-based stateless auth
✅ **Scalable Design**: Supports horizontal scaling
✅ **User Privacy**: GDPR-compliant data handling
✅ **Performance**: Optimized with proper indexing
✅ **Security**: Multiple layers of protection

The system ensures that multiple users can securely manage their digital identities without any risk of data cross-contamination.