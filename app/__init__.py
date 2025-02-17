from flask import Flask
from app.routes import home_routes, login_routes, user_routes, story_editor_routes
from app.api import api_bp
from app.extensions import db, bcrypt

def create_app():
    app = Flask(__name__)
    # register the db
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"

    # set the secret key
    app.secret_key = "super secret for now (no)"
    
    # Register blueprints
    app.register_blueprint(home_routes.bp)
    app.register_blueprint(login_routes.bp)
    app.register_blueprint(user_routes.bp)
    app.register_blueprint(story_editor_routes.bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    bcrypt.init_app(app)

    # create and populate the database
    from app.models import Story, StoryEdge, StoryNode, User
    from populate import populate

    db.init_app(app)

    # create the db
    with app.app_context():
        db.create_all()
        # populate() # Amment to populate the empty db with some example data
        
    
    return app
