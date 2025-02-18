from app.extensions import db
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class StoryEdge(db.Model):
    __tablename__ = "story_edges"
    
    from_node_id: Mapped[int] = mapped_column(
        db.ForeignKey("story_nodes.id", ondelete="CASCADE"), 
        primary_key=True
    )
    to_node_id: Mapped[int] = mapped_column(
        db.ForeignKey("story_nodes.id", ondelete="CASCADE"), 
        primary_key=True
    )
    condition: Mapped[str] = mapped_column(default="SUCCESS")

    # Relationships for easy access with cascade behavior
    from_node = relationship(
        "StoryNode", 
        foreign_keys=[from_node_id],
        backref=backref("outgoing_edges", cascade="all, delete-orphan")
    )
    to_node = relationship(
        "StoryNode", 
        foreign_keys=[to_node_id],
        backref=backref("incoming_edges", cascade="all, delete-orphan")
    )

    def __repr__(self):
        return f"<StoryEdge {self.from_node_id} -> {self.to_node_id}>"

    def serialize(self) -> object:
        return {
            "from": self.from_node_id,
            "to": self.to_node_id,
            "condition": self.condition
        }
