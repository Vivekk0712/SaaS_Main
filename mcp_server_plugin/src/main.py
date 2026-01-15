"""Main application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .config import settings, logger, db_pool
from .routes import query_router
from .domain.types import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("🚀 Starting MCP Server Plugin...")
    
    try:
        # Connect to database
        await db_pool.connect()
        
        # Test connection
        is_connected = await db_pool.test_connection()
        if not is_connected:
            logger.error("❌ Database connection test failed")
            raise Exception("Database connection failed")
        
        logger.info("✅ MCP Server Plugin started successfully")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down MCP Server Plugin...")
    await db_pool.close()
    logger.info("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="MCP Server Plugin",
    description="AI-powered natural language database querying for School ERP",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint (MUST BE BEFORE ROUTERS)
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    db_status = await db_pool.test_connection()
    
    return HealthResponse(
        status="healthy" if db_status else "unhealthy",
        service="mcp-server-plugin",
        database=db_status
    )

# Include routers
app.include_router(query_router)

# Serve static files (test UI) - MUST BE LAST
try:
    app.mount("/", StaticFiles(directory="public", html=True), name="static")
except RuntimeError:
    logger.warning("Public directory not found, skipping static files")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if not settings.is_production else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=not settings.is_production
    )
