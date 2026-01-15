# MCP Server - Production Integration Guide

## How JWT Authentication Works

### Overview

```
User logs into ERP → ERP Backend creates JWT → Frontend stores JWT → 
Frontend sends JWT to MCP Server → MCP verifies JWT → Returns data
```

## Step-by-Step Integration

### 1. ERP Backend Setup (Node.js/Express Example)

#### Install JWT Library
```bash
npm install jsonwebtoken
```

#### Create JWT Token When User Logs In

```javascript
// auth.controller.js
const jwt = require('jsonwebtoken');

// When user logs in successfully
async function login(req, res) {
  const { username, password } = req.body;
  
  // Verify user credentials (your existing logic)
  const user = await User.findOne({ username });
  if (!user || !user.verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create JWT token
  const token = jwt.sign(
    {
      sub: user.id,                    // User ID
      roles: user.roles,               // ['teacher', 'hod', etc.]
      iss: 'https://erp.example.com',  // Your ERP URL
      aud: 'erp_mcp',                  // Audience (MCP server)
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    },
    process.env.JWT_SECRET,            // Same secret as MCP server
    { algorithm: 'HS256' }
  );
  
  // Return token to frontend
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      roles: user.roles
    }
  });
}
```

### 2. Frontend Setup (React Example)

#### Store Token After Login

```javascript
// Login.jsx
import { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    // Store token in localStorage or sessionStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };
  
  return (
    <div>
      <input value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

#### Create MCP Query Component

```javascript
// MCPQuery.jsx
import { useState } from 'react';

function MCPQuery() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  
  const askQuestion = async () => {
    setLoading(true);
    
    // Get token from storage
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://localhost:5003/api/v1/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          context: {}
        })
      });
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Query failed:', error);
      setAnswer('Error: Could not get answer');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mcp-query">
      <h2>Ask a Question</h2>
      <textarea 
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask about students, teachers, attendance..."
      />
      <button onClick={askQuestion} disabled={loading}>
        {loading ? 'Processing...' : 'Ask'}
      </button>
      {answer && (
        <div className="answer">
          <h3>Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default MCPQuery;
```

### 3. Alternative: Proxy Through Your Backend

Instead of calling MCP directly from frontend, proxy through your backend:

#### Backend Proxy Endpoint

```javascript
// mcp.controller.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Middleware to verify user is logged in
const requireAuth = (req, res, next) => {
  // Your existing auth middleware
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Proxy endpoint
app.post('/api/mcp/query', requireAuth, async (req, res) => {
  const { question, context } = req.body;
  const user = req.session.user;
  
  // Generate JWT for MCP server
  const mcpToken = jwt.sign(
    {
      sub: user.id,
      roles: user.roles,
      iss: 'https://erp.example.com',
      aud: 'erp_mcp'
    },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }  // Short-lived token
  );
  
  try {
    // Call MCP server
    const response = await axios.post('http://localhost:5003/api/v1/query', {
      question,
      context
    }, {
      headers: {
        'Authorization': `Bearer ${mcpToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Return result to frontend
    res.json(response.data);
  } catch (error) {
    console.error('MCP query failed:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});
```

#### Frontend (Simpler)

```javascript
// MCPQuery.jsx - Using backend proxy
const askQuestion = async () => {
  const response = await fetch('/api/mcp/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Include session cookie
    body: JSON.stringify({ question, context: {} })
  });
  
  const data = await response.json();
  setAnswer(data.answer);
};
```

## Configuration

### 1. Shared JWT Secret

Both ERP backend and MCP server must use the **same secret**:

**ERP Backend (.env):**
```env
JWT_SECRET=your_super_secret_key_here_min_32_chars
```

**MCP Server (.env):**
```env
ERP_JWT_SECRET=your_super_secret_key_here_min_32_chars
ERP_JWT_ISSUER=https://erp.example.com
ERP_JWT_AUDIENCE=erp_mcp
```

### 2. CORS Configuration

If calling MCP directly from frontend, configure CORS:

**MCP Server (.env):**
```env
FRONTEND_URL=https://your-erp-frontend.com
```

## Security Best Practices

### 1. Use HTTPS in Production
```
Frontend → HTTPS → Backend → HTTPS → MCP Server
```

### 2. Short Token Expiry
```javascript
// For direct frontend calls: 1 hour
expiresIn: '1h'

// For backend proxy: 5 minutes
expiresIn: '5m'
```

### 3. Token Refresh
```javascript
// Refresh token before expiry
setInterval(() => {
  refreshToken();
}, 50 * 60 * 1000); // Every 50 minutes
```

### 4. Secure Token Storage
```javascript
// Use httpOnly cookies (best)
res.cookie('authToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Or sessionStorage (better than localStorage)
sessionStorage.setItem('authToken', token);
```

## Role-Based Access Example

### Backend: Set User Roles

```javascript
// When creating user
const user = {
  id: 'user123',
  name: 'John Doe',
  roles: ['teacher', 'hod'],  // Multiple roles
  department: 'Mathematics'
};

// In JWT
const token = jwt.sign({
  sub: user.id,
  roles: user.roles,
  department: user.department
}, JWT_SECRET);
```

### MCP Server: Enforces Permissions

MCP automatically checks:
- Teachers can see their classes
- HODs can see their department
- Principals can see everything
- Students can only see their own data

## Complete Integration Flow

```
1. User Login
   ↓
2. ERP Backend validates credentials
   ↓
3. ERP Backend creates JWT with user roles
   ↓
4. Frontend stores JWT
   ↓
5. User asks question in UI
   ↓
6. Frontend sends question + JWT to MCP
   ↓
7. MCP verifies JWT signature
   ↓
8. MCP extracts user_id and roles
   ↓
9. MCP checks permissions for query
   ↓
10. MCP executes safe SQL query
    ↓
11. MCP returns answer
    ↓
12. Frontend displays answer
```

## Testing Integration

### 1. Test JWT Generation

```javascript
// test-jwt.js
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: 'teacher123',
    roles: ['teacher', 'hod'],
    iss: 'https://erp.example.com',
    aud: 'erp_mcp'
  },
  'your_secret_key',
  { expiresIn: '1h' }
);

console.log('Token:', token);

// Verify it
const decoded = jwt.verify(token, 'your_secret_key');
console.log('Decoded:', decoded);
```

### 2. Test MCP Call

```bash
curl -X POST http://localhost:5003/api/v1/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all classes"}'
```

## Deployment Checklist

- [ ] Same JWT_SECRET in both ERP and MCP
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Token expiry set appropriately
- [ ] User roles properly assigned
- [ ] MCP server accessible from ERP backend
- [ ] Firewall rules configured
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Error handling in place

## Common Issues

### Issue: "Invalid token"
**Solution:** Check JWT_SECRET matches in both systems

### Issue: "Permission denied"
**Solution:** Check user roles in JWT token

### Issue: CORS error
**Solution:** Add frontend URL to MCP CORS config

### Issue: Token expired
**Solution:** Implement token refresh mechanism

## Summary

**Two Integration Options:**

### Option 1: Direct Frontend → MCP
✅ Faster (no proxy)  
❌ Exposes MCP endpoint  
✅ Good for internal networks  

### Option 2: Frontend → Backend → MCP
✅ More secure  
✅ Backend controls access  
✅ Can add caching/logging  
❌ Slightly slower  

**Recommended:** Use Option 2 (backend proxy) for production!

The MCP server is designed to work seamlessly with your existing ERP authentication system. Just share the JWT secret and you're good to go! 🚀
