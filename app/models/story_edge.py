from app.extensions import db
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import relationship

class StoryEdge(db.Model):
    __tablename__ = "story_edges"


    from_node_id: Mapped[int] = mapped_column(db.ForeignKey("story_nodes.id"), primary_key=True)
    to_node_id: Mapped[int] = mapped_column(db.ForeignKey("story_nodes.id"), primary_key=True)
    condition: Mapped[str] = mapped_column(default="SUCCESS")

    # Relationship for easy access
    from_node = relationship("StoryNode", foreign_keys=[from_node_id], backref="outgoing_edges")
    to_node = relationship("StoryNode", foreign_keys=[to_node_id], backref="incoming_edges")

    def __repr__(self):
        return f"<StoryEdge {self.from_node_id} -> {self.to_node_id}>"
