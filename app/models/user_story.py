from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from app.extensions import db  # adjust import based on your project structure

class UserStory(db.Model):
    __tablename__ = "user_stories"
    
    # Composite primary key: (user_id, story_id)
    user_id: Mapped[int] = mapped_column(db.Integer, ForeignKey("users.id"), primary_key=True)
    story_id: Mapped[int] = mapped_column(db.Integer, ForeignKey("stories.id"), primary_key=True)
    
    # Store progress (this could be an integer, a percentage, or even a pointer to a StoryNode id)
    progress: Mapped[int] = mapped_column(db.Integer, default=0)
    health: Mapped[int] = mapped_column(db.Integer, default=100)
    
    # Relationships back to User and Story
    user = relationship("User", back_populates="user_stories")
    story = relationship("Story", back_populates="user_stories")
    
    def __repr__(self):
        return f"<UserStory user_id={self.user_id}, story_id={self.story_id}, progress={self.progress}>"

    def serialize(self):
        return {
            "story_id": self.story_id,
            "progress": self.progress,
            "health": self.health
        }