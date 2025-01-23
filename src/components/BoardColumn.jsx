// src/components/BoardColumn.jsx
import React from 'react';
import './css/BoardColumn.css';

function BoardColumn({ title, cards }) {
  return (
    <div className="board-column">
      <div className="board-column-header">
        <h3>{title}</h3>
      </div>

      <div className="board-column-body">
        {cards.map((card, idx) => (
          <div key={idx} className="board-card">
            <div className="board-card-tags">
              {card.tags.map((tag, i) => (
                <span key={i} className="board-card-tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="board-card-title">{card.title}</div>
            {card.note && (
              <div className="board-card-note">{card.note}</div>
            )}
            {card.progress !== undefined && (
              <div className="board-card-progress">
                Progress: {card.progress}%
              </div>
            )}
            <div className="board-card-footer">
              {card.avatars && (
                <div className="board-card-avatars">
                  {card.avatars.map((avatarUrl, i) => (
                    <img
                      key={i}
                      src={avatarUrl}
                      alt="avatar"
                      className="avatar-img"
                    />
                  ))}
                </div>
              )}
              <div className="board-card-stats">
                <span>👍 {card.likes || 0}</span>
                <span>💬 {card.comments || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoardColumn;
