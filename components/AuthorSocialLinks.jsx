'use client';

import React from 'react';

const DEFAULT_ICON_SIZE = 18;

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FlickrIcon(props) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" {...props}>
      <circle cx="8.5" cy="12" r="4" fill="currentColor" />
      <circle cx="15.5" cy="12" r="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function WebsiteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 3c2.6 3.3 2.6 14.7 0 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 3c-2.6 3.3-2.6 14.7 0 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function KofiIcon(props) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" {...props}>
      <path
        d="M4 7h11.5a3 3 0 0 1 0 6H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7v7a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 10.3c-.6-.6-.6-1.6 0-2.2a1.6 1.6 0 0 1 2.2 0 1.6 1.6 0 0 1 2.2 0c.6.6.6 1.6 0 2.2l-2.2 2.2z"
        fill="currentColor"
      />
    </svg>
  );
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  flickr: FlickrIcon,
  website: WebsiteIcon,
  kofi: KofiIcon
};

export default function AuthorSocialLinks({
  links,
  authorName,
  iconSize = DEFAULT_ICON_SIZE,
  className = '',
  iconClassName = 'text-gray-500 hover:text-gray-800 transition-colors'
}) {
  if (!Array.isArray(links) || links.length === 0) return null;

  const containerClasses = ['inline-flex', 'items-center', 'gap-2'];
  if (className) containerClasses.push(className);

  return (
    <span className={containerClasses.join(' ')}>
      {links.map((link) => {
        const Icon = SOCIAL_ICONS[link.key];
        if (!Icon) return null;
        return (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${authorName ?? 'Author'} on ${link.label}`}
            title={link.label}
            className={iconClassName}
            style={{ display: 'inline-flex' }}
          >
            <Icon width={iconSize} height={iconSize} />
          </a>
        );
      })}
    </span>
  );
}

export { DEFAULT_ICON_SIZE as SOCIAL_ICON_SIZE, SOCIAL_ICONS };
