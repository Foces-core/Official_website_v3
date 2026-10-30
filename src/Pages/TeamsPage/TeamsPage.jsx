import { useState } from 'react';
import { Link } from 'react-router';
import './TeamsPage.css';
import { execomArchive } from '../../data/execomArchive.js';
import Seo from '../../Components/Seo/Seo.jsx';

/**
 * Execom archive (/teams): one group photo per past committee year.
 * The photo slot is a placeholder until the real images land.
 */
export default function TeamsPage() {
  const [year, setYear] = useState(execomArchive[0].year);
  const batch = execomArchive.find((b) => b.year === year) || execomArchive[0];

  return (
    <div className="teams-page">
      <Seo path="/teams" />
      <div className="teams-glow teams-glow-1" aria-hidden="true" />
      <div className="teams-glow teams-glow-2" aria-hidden="true" />

      <nav className="teams-nav">
        <div className="teams-nav-left">
          <Link to="/" className="teams-logo">
            FOCES
          </Link>
          <span className="teams-sep">/</span>
          <span className="teams-tag">EXECOM ARCHIVE</span>
        </div>
      </nav>

      <div className="teams-years">
        {execomArchive.map((b) => (
          <button
            key={b.year}
            type="button"
            className={year === b.year ? 'teams-year active' : 'teams-year'}
            onClick={() => setYear(b.year)}
          >
            {b.year}
          </button>
        ))}
      </div>

      <main className="teams-gallery">
        <div className="teams-status">
          <h1 className="teams-title">{batch.title}</h1>
        </div>
        <div className="teams-group-card">
          {batch.photo ? (
            <img
              className="teams-group-img"
              src={batch.photo}
              srcSet={`${batch.photoSmall} ${batch.photoSmallWidth}w, ${batch.photo} ${batch.photoWidth}w`}
              alt={`${batch.title} group photo`}
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="teams-group-placeholder" aria-hidden="true">
              Group photo
            </div>
          )}
          <div className="teams-group-meta">
            <span className="teams-meta-label">GROUP PHOTO</span>
            <span className="teams-meta-sub">{batch.groupSub || '—'}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
