import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import './TeamsPage.css';
import { ERAS, ROLE_FILTERS, execomArchive } from '../../data/execomArchive.js';
import { batchVisible, memberMatches, searchMembers } from '../../utils/execomArchiveLogic.js';
import useEscapeClose from '../../hooks/useEscapeClose.js';
import useScrollLock from '../../hooks/useScrollLock.js';
import Seo from '../../Components/Seo/Seo.jsx';

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return (
    <div className="teams-avatar" aria-hidden="true">
      {initials}
    </div>
  );
}

function MemberCard({ member, onOpen }) {
  return (
    <button className="teams-card" type="button" onClick={() => onOpen(member)}>
      <Avatar name={member.name} />
      <div className="teams-card-meta">
        <span className="teams-card-name">{member.name}</span>
        <span className="teams-card-role">{member.role}</span>
        <span className="teams-card-company">{member.company}</span>
      </div>
    </button>
  );
}

Avatar.propTypes = { name: PropTypes.string.isRequired };

MemberCard.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
};

export default function TeamsPage() {
  const [era, setEra] = useState('all');
  const [year, setYear] = useState(execomArchive[0].year);
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  useEscapeClose({ isActive: !!lightbox, onClose: () => setLightbox(null) });
  useScrollLock(!!lightbox);

  const visibleBatches = execomArchive.filter((b) => batchVisible(b, era));
  const batch = visibleBatches.find((b) => b.year === year) || visibleBatches[0];
  const searching = query.trim().length > 0;

  const members = searching
    ? searchMembers(execomArchive, query, era, role)
    : (batch?.members || []).filter((m) => memberMatches(m, '', role));

  // Clamp the index at render time so a shrinking list (filter/search)
  // never leaves a stale slide selected — no effect needed.
  const index = members.length ? Math.min(carouselIndex, members.length - 1) : 0;
  const openPrev = () =>
    setCarouselIndex(members.length ? (index - 1 + members.length) % members.length : 0);
  const openNext = () => setCarouselIndex(members.length ? (index + 1) % members.length : 0);
  const current = members[index] || null;

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
        <div className="teams-search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names, roles, companies..."
            aria-label="Search members"
          />
          {query && (
            <button
              className="teams-search-clear"
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              &times;
            </button>
          )}
        </div>
        <div className="teams-toggle">
          <button
            type="button"
            className={view === 'grid' ? 'teams-view-btn active' : 'teams-view-btn'}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            ▦
          </button>
          <button
            type="button"
            className={view === 'carousel' ? 'teams-view-btn active' : 'teams-view-btn'}
            onClick={() => setView('carousel')}
            aria-label="Carousel view"
          >
            ▯
          </button>
        </div>
      </nav>

      <div className="teams-eras">
        {ERAS.map((e) => (
          <button
            key={e.id}
            type="button"
            className={era === e.id ? 'teams-era active' : 'teams-era'}
            onClick={() => {
              setEra(e.id);
              const first = execomArchive.find((b) => batchVisible(b, e.id));
              if (first) setYear(first.year);
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="teams-filters">
        <div className="teams-years">
          {visibleBatches.map((b) => (
            <button
              key={b.year}
              type="button"
              className={year === b.year ? 'teams-year active' : 'teams-year'}
              onClick={() => setYear(b.year)}
            >
              {b.year} <span className="teams-count">{b.members.length}</span>
            </button>
          ))}
        </div>
        <div className="teams-roles">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={role === r.id ? 'teams-role active' : 'teams-role'}
              onClick={() => setRole(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <main className="teams-gallery">
        <div className="teams-status">
          <h1 className="teams-title">{searching ? `Search: “${query.trim()}”` : batch?.title}</h1>
          <span className="teams-badge">{members.length} Members</span>
        </div>

        {view === 'grid' && (
          <section className="teams-grid-view">
            {!searching && (
              <div className="teams-group-card">
                <div className="teams-group-placeholder" aria-hidden="true">
                  Group photo
                </div>
                <div className="teams-group-meta">
                  <span className="teams-meta-label">GROUP PHOTO</span>
                  <span className="teams-meta-sub">{batch?.groupSub || '—'}</span>
                </div>
              </div>
            )}
            <div className="teams-grid">
              {members.map((m) => (
                <MemberCard
                  key={`${m.name}-${m.batchTitle || batch?.year}`}
                  member={m}
                  onOpen={setLightbox}
                />
              ))}
              {members.length === 0 && <p className="teams-empty">No members match.</p>}
            </div>
          </section>
        )}

        {view === 'carousel' && (
          <section className="teams-carousel">
            <div className="teams-carousel-stage">
              <button
                type="button"
                className="teams-caro-nav"
                onClick={openPrev}
                aria-label="Previous member"
              >
                ‹
              </button>
              {current && (
                <div className="teams-caro-slide">
                  <Avatar name={current.name} />
                  <h2>{current.name}</h2>
                  <p>{current.role}</p>
                  <p>{current.company}</p>
                </div>
              )}
              <button
                type="button"
                className="teams-caro-nav"
                onClick={openNext}
                aria-label="Next member"
              >
                ›
              </button>
            </div>
            <div className="teams-thumbs">
              {members.map((m, i) => (
                <button
                  key={m.name}
                  type="button"
                  className={i === index ? 'teams-thumb active' : 'teams-thumb'}
                  onClick={() => setCarouselIndex(i)}
                  aria-label={`Show ${m.name}`}
                >
                  {m.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {lightbox && (
        <div className="teams-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.name}>
          <button
            type="button"
            className="teams-lightbox-overlay"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          />
          <div className="teams-lightbox-box">
            <Avatar name={lightbox.name} />
            <div className="teams-lightbox-caption">
              <h3>{lightbox.name}</h3>
              <p>
                {lightbox.role} · {lightbox.company}
              </p>
            </div>
            <button
              type="button"
              className="teams-lightbox-x"
              aria-label="Close member view"
              onClick={() => setLightbox(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
