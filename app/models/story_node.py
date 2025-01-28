from app.extensions import db
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import relationship

class StoryNode(db.Model):
    __tablename__ = "story_nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    node_type: Mapped[str] = mapped_column(default="DIALOG")
    content: Mapped[str] = mapped_column()
    # one to many relation ship with Story (a story has many nodes)
    story_id: Mapped[int] = mapped_column(ForeignKey("stories.id"))
    story: Mapped["Story"] = relationship(back_populates="nodes")
    # many to many relations between node

    def __repr__(self):
        return f"<StoryNode {self.id} ({self.node_type})>"
