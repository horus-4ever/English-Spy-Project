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
    speaker: Mapped[str] = mapped_column()
    left_img: Mapped[str] = mapped_column()
    right_img: Mapped[str] = mapped_column()
    background_img: Mapped[str] = mapped_column()
    # one to many relation ship with Story (a story has many nodes)
    story_id: Mapped[int] = mapped_column(ForeignKey("stories.id"))
    story: Mapped["Story"] = relationship(back_populates="nodes")
    # many to many relations between node

    def __repr__(self):
        return f"<StoryNode {self.id} ({self.node_type})>"

    def serialize(self) -> object:
        return {
            "id": self.id,
            "type": self.node_type,
            "content": self.content,
            "speaker": self.speaker,
            "left_img": self.left_img,
            "right_img": self.right_img,
            "background_img": self.background_img
        }
    
    @classmethod
    def default(cls, parent: int, node_type: str = "DIALOG") -> "StoryNode":
        """Create a default node"""
        return cls(
            node_type=node_type,
            content="Node content",
            speaker="Speaker",
            left_img="../static/images/p1.png",
            right_img="../static/images/p2.png",
            background_img="../static/images/joli_paysage.jpeg",
            story_id=parent
        )