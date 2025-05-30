from app.extensions import db
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import relationship

class Story(db.Model):
    __tablename__ = "stories"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column()
    description: Mapped[str]
    
    # Existing relationship with StoryNode
    nodes: Mapped[list["StoryNode"]] = relationship(back_populates="story")
    
    # Relationship with the association object
    user_stories = relationship("UserStory", back_populates="story")

    def __repr__(self):
        return f"<Story {self.title}>"

    def serialize(self) -> object:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description
        }
    
    @classmethod
    def default(cls) -> "Story":
        """Create a default empty story"""
        return cls(
            title="Title",
            description="Story's description"
        )
