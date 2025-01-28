from flask import Flask
from app.routes import home_routes
from app.api import api_bp
from app.extensions import db

def create_app():
    app = Flask(__name__)
    # register the db
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
    
    # Register blueprints
    app.register_blueprint(home_routes.bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    # create and populate the database
    from app.models import Story, StoryEdge, StoryNode, User
    from populate import populate

    db.init_app(app)

    # create the db
    with app.app_context():
        db.create_all()
        # populate() # remove the comment to populate the empty db with some example data
        
    
    return app
