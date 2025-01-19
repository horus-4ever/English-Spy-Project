from flask import Flask
from app.routes import home_routes

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(home_routes.bp)
    
    return app
